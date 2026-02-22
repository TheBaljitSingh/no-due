import { parseWhatsappMessage } from "./whatsapp.parser.js";
import { sendMainMenu } from "./whatsapp.template.js";
import whatsappService from "../../services/whatsapp.service.js";
import { getCurrentDue, updateTransactionStatus } from "../../services/due.service.js"
import whatsappAuditService from "../../services/whatsapp.audit.service.js";
import { getOrCreateSession, updateSession, getValidSession } from "../../services/whatsappSession.service.js"
import whatsappSessionModel from "../../model/whatsappSession.model.js";
import whatsappMessage from "../../model/whatsappMessage.modal.js";
import Customer from "../../model/customer.model.js";
import User from "../../model/user.model.js";
import { getIo } from "../../socket/index.js";

export const handleWhatsappEvent = async (payload) => {
  console.log('webhook received from the user');
  const entry = payload?.entry?.[0];
  if (!entry) return;

  console.log("payload", payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]); // statuses - >messages

  // Handle Status Updates (Sent, Delivered, Read, Failed)
  const statusUpdate = entry?.changes?.[0]?.value?.messages?.[0];
  if (statusUpdate) {
    console.log('status update', statusUpdate);
    const { id, button } = statusUpdate;
    // console.log(`[WhatsApp Status] Message ${id} is ${status}`);
    //have to check the passed parameters
    // await whatsappAuditService.updateMessageStatus(id, button, errors);
    // return; doubt here
  }

  const intent = parseWhatsappMessage(entry);
  console.log("intent", intent, "\n");
  if (!intent) return;


  const rawMsg = entry?.changes?.[0]?.value?.messages?.[0];
  const metadata = entry?.changes?.[0]?.value?.metadata;
  const recipientPhoneId = metadata?.phone_number_id;

  if (!recipientPhoneId) {
    console.warn("[Webhook] Missing phone_number_id in metadata");
    return;
  }

  // 1. Find the merchant (User) who owns this phone number
  const merchant = await User.findOne({ "whatsapp.phoneNumberId": recipientPhoneId });
  if (!merchant) {
    console.error(`[Webhook] No merchant found for phoneNumberId: ${recipientPhoneId}`);
    return;
  }

  // 2. Find the customer belonging to this merchant with this mobile number
  const customer = await Customer.findOne({
    mobile: intent.from,
    CustomerOfComapny: merchant._id
  });

  if (!customer) {
    console.warn(`[Webhook] Customer ${intent.from} not found in merchant ${merchant.email}'s list.`);
  }

  const mercantCredentials = {
    accessToken: merchant?.whatsapp?.accessToken,
    phoneNumberId: merchant?.whatsapp?.phoneNumberId
  };

  if (rawMsg?.id && mercantCredentials.accessToken && mercantCredentials.phoneNumberId) {
    //read receipt
    await whatsappService.markRead(rawMsg.id, mercantCredentials.accessToken, mercantCredentials.phoneNumberId);
  }


  // Check for duplicate response to the same message// need to verify this one

  console.log("printing the intent: ", intent);

  if (intent.context?.id && intent.type === "BUTTON") {
    const existingResponse = await whatsappMessage.findOne({
      responseToMessageId: intent.context.id,
      "metadata.type": { $in: ["BUTTON", "LIST"] }
    });

    if (existingResponse) {
      console.warn(`[Audit] Duplicate response blocked. Message ${intent.context.id} already responded to.`);
      return;
    }
  }

  // Audit Log Inbound
  await whatsappAuditService.logMessage({
    mobile: intent.from,
    direction: "INBOUND",
    type: intent.type === "LIST" ? "interactive" : (intent.type === "BUTTON" ? "button" : "text"),
    text: intent.text || intent.actionId,
    whatsappMessageId: rawMsg?.id,
    status: "received",
    payload: intent,
    responseToMessageId: intent.context?.id
  });

  // updating  the customer master table only it it is button as im sending buttons in the template
  if (intent.type === 'BUTTON') {
    if (customer) {
      const feedbackText = intent.text || intent.actionId || "Interaction received";
      await Customer.findByIdAndUpdate(
        customer._id,
        {
          feedback: feedbackText,
          lastInteraction: new Date()
        }
      );

      // Emit live update via socket to the specific merchant's room
      try {
        const io = getIo();
        io.to(merchant._id.toString()).emit("feedback_updated", {
          feedback: feedbackText,
          mobile: intent.from,
          customerName: customer.name,
          messageId: rawMsg?.id // used to prevent duplicate toasts in frontend
        });
        console.log(`[Socket] Emitted feedback_updated to merchant ${merchant._id}`);
      } catch (error) {
        console.error("Error emitting feedback update:", error);
      }
    } else {
      console.warn(`[Webhook] Skipping feedback update: Customer with mobile ${intent.from} not found.`);
    }
  }

  // Greeting
  if (intent.type === "TEXT" && ["hi", "hello"].includes(intent.text.toLowerCase())) {

    //i have to initialize the session
    const session = await getOrCreateSession(intent.from, merchant._id);

    //will send menu from pre defined templates 
    return sendMainMenu(intent.from, mercantCredentials);
  } else if (intent.type === "LIST" || intent.type === "BUTTON") {
    // List & Button action routing seprately
    routeAction(intent, mercantCredentials, merchant);
  }
};

const routeAction = async (intent, mercantCredentials, merchant) => {
  const { actionId, from } = intent;

  //have to update the action Id to use it like chat bot
  console.log(`User ${from} selected action Id : ${actionId}`);

  // const session = await whatsappSessionModel.findOne({ mobile: from });
  const session = await getValidSession(from, merchant._id);


  switch (actionId) {
    //Reminder Response(list) handling


    case "CHECK_CURRENT_DUE":
      // TODO: Fetch and send current due
      console.log("Processing CHECK_CURRENT_DUE");
      //check my current due

      if (session) {
        await updateSession(intent.from, merchant._id, { state: "CHECK_CURRENT_DUE" });
        const response = await getCurrentDue({ from, merchantId: merchant._id });
        if (response.success) {
          if (mercantCredentials.accessToken && mercantCredentials.phoneNumberId) {
            await whatsappService.sendTextMessage({
              to: from,
              text: response?.text,
              accessToken: mercantCredentials.accessToken,
              phoneNumberId: mercantCredentials.phoneNumberId
            });
          }
        }

      } else {

        const restartConversactionTxt = `Due to inactive on the channel, session got timed out ⌛. 
Just type *Hi* to restart your conversation👋 `;
        if (mercantCredentials.accessToken && mercantCredentials.phoneNumberId) {
          whatsappService.sendTextMessage({
            to: intent.from,
            text: restartConversactionTxt,
            accessToken: mercantCredentials.accessToken,
            phoneNumberId: mercantCredentials.phoneNumberId
          });
        }
      }


      break;

    case "MINI_STATEMENT":
      console.log("Processing MINI_STATEMENT");
      if (session) {
        await updateSession(intent.from, merchant._id, { state: "MINI_STATEMENT" });

        const customer = await Customer.findOne({ mobile: from, CustomerOfComapny: merchant._id });
        if (customer) {
          // sendMiniStatement independently fetches last 5 dues + their payments
          await whatsappService.sendMiniStatement({
            from: from,
            customerId: customer._id,
            accessToken: mercantCredentials.accessToken,
            phoneNumberId: mercantCredentials.phoneNumberId
          });
        } else {
          if (mercantCredentials.accessToken && mercantCredentials.phoneNumberId) {
            await whatsappService.sendTextMessage({
              to: from,
              text: "Customer not found.",
              accessToken: mercantCredentials.accessToken,
              phoneNumberId: mercantCredentials.phoneNumberId
            });
          }
        }
      } else {
        const restartConversactionTxt = `Due to inactive on the channel, session got timed out ⌛. 
Just type *Hi* to restart your conversation👋 `;
        if (mercantCredentials.accessToken && mercantCredentials.phoneNumberId) {
          whatsappService.sendTextMessage({
            to: intent.from,
            text: restartConversactionTxt,
            accessToken: mercantCredentials.accessToken,
            phoneNumberId: mercantCredentials.phoneNumberId
          });
        }
      }

      break;


    //template response handling
    case "I will pay today": //updating the reminder response
    case "I will pay within a week":
    case "I will pay soon":
    case "Need statement":
      try {
        await updateTransactionStatus({
          from,
          actionId,
          contextId: intent.context?.id,
          merchantId: merchant._id
        });
      } catch (error) {
        console.error("Error processing whatsapp response:", error);
      }
      break;


    default:
      console.log("Unknown action:", actionId);
  }
};
