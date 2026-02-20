import { parseWhatsappMessage } from "./whatsapp.parser.js";
import { sendMainMenu } from "./whatsapp.template.js";
import whatsappService from "../../services/whatsapp.service.js";
import { getCurrentDue, updateTransactionStatus } from "../../services/due.service.js"
import whatsappAuditService from "../../services/whatsapp.audit.service.js";
import { getOrCreateSession, updateSession, getValidSession } from "../../services/whatsappSession.service.js"
import whatsappSessionModel from "../../model/whatsappSession.model.js";
import whatsappMessage from "../../model/whatsappMessage.modal.js";
import Customer from "../../model/customer.model.js";

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

  // Get merchant credentials from customer
  const customer = await Customer.findOne({ mobile: intent.from }).populate('CustomerOfComapny');
  const merchant = customer?.CustomerOfComapny;

  const mercantCredentials = {
    accessToken: merchant?.whatsapp?.accessToken,
    phoneNumberId: merchant?.whatsapp?.phoneNumberId
  };

  if (rawMsg?.id && mercantCredentials.accessToken && mercantCredentials.phoneNumberId) {
    //read receipt
    await whatsappService.markRead(rawMsg.id, mercantCredentials.accessToken, mercantCredentials.phoneNumberId);
  }


  // Check for duplicate response to the same message// need to verify this one
  if (intent.context?.id) {
    const existingResponse = await whatsappMessage.findOne({
      responseToMessageId: intent.context.id,
      "metadata.type": "Button"
    });

    if (existingResponse) {
      console.log(existingResponse);
      console.warn(`[Audit] Duplicate response blocked. Message ${intent.context.id} already responded to.`);
      return;
    }
  }

  //if there is not session then send msg to start session

  // Audit Log Inbound
  await whatsappAuditService.logMessage({
    mobile: intent.from,
    direction: "INBOUND",
    type: intent.type === "LIST" ? "interactive" : "text",
    text: intent.text || intent.actionId,
    whatsappMessageId: rawMsg?.id,
    status: "received",
    payload: intent,
    responseToMessageId: intent.context?.id
  });

  // updating  the customer master table only it it is button as im sending buttons in the template
  if (intent.type === 'BUTTON') {
    try {
      const feedbackText = intent.text || intent.actionId || "Interaction received";
      await Customer.findOneAndUpdate(
        { mobile: intent.from },
        {
          feedback: feedbackText,
          lastInteraction: new Date()
        }
      );

      console.log("updated the status of message received");
    } catch (err) {
      console.error("Error updating customer feedback:", err);
    }
  }

  // Greeting
  if (intent.type === "TEXT" && ["hi", "hello"].includes(intent.text.toLowerCase())) {

    //i have to initialize the session
    const session = await getOrCreateSession(intent.from);

    //will send menu from pre defined templates 
    return sendMainMenu(intent.from, mercantCredentials);
  } else if (intent.type === "LIST" || intent.type === "BUTTON") {
    // List & Button action routing seprately
    routeAction(intent, mercantCredentials);
  }
};

const routeAction = async (intent, mercantCredentials) => {
  const { actionId, from } = intent;

  //have to update the action Id to use it like chat bot
  console.log(`User ${from} selected action Id : ${actionId}`);

  // const session = await whatsappSessionModel.findOne({ mobile: from });
  const session = await getValidSession(from);


  switch (actionId) {
    //Reminder Response(list) handling


    case "CHECK_CURRENT_DUE":
      // TODO: Fetch and send current due
      console.log("Processing CHECK_CURRENT_DUE");
      //check my current due

      if (session) {
        await updateSession(intent.from, { state: "CHECK_CURRENT_DUE" });
        const response = await getCurrentDue({ from });
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
        await updateSession(intent.from, { state: "MINI_STATEMENT" });

        const customer = await Customer.findOne({ mobile: from });
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
          contextId: intent.context?.id // Pass the context ID (wamid of original message)
        });
      } catch (error) {
        console.error("Error processing whatsapp response:", error);
      }
      break;


    default:
      console.log("Unknown action:", actionId);
  }
};
