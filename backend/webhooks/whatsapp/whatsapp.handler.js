import { parseWhatsappMessage } from "./whatsapp.parser.js";
import { sendMainMenu } from "./whatsapp.template.js";
import whatsappService from "../../services/whatsapp.service.js";
import {getCurrentDue} from "../../services/due.service.js"

export const handleWhatsappEvent = async (payload) => {
  const entry = payload?.entry?.[0];
  if (!entry) return;

  const intent = parseWhatsappMessage(entry);
  if (!intent) return;

  // Greeting
  if (intent.type === "TEXT" && ["hi", "hello"].includes(intent.text)) {

    //will send menu from pre defined templates 
    return sendMainMenu(intent.from);
  }

  // List action routing
  if (intent.type === "LIST") {
    routeAction(intent);
  }
};

const routeAction = async (intent) => {
  const { actionId, from } = intent;
  console.log(`User ${from} selected action Id : ${actionId}`);

  switch (actionId) {
    case "CHECK_CURRENT_DUE":
      // TODO: Fetch and send current due
      console.log("Processing CHECK_CURRENT_DUE");
      //check my current due
      const response = await getCurrentDue({from});
      if(response.success){
        await whatsappService.sendTextMessage({to:from, text:response?.text});
      }

      //have send text message 

      break;
    case "DUE_STATEMENT":
      // TODO: Generate and send statement
      console.log("Processing DUE_STATEMENT");
      break;
    case "LAST_PAYMENT":
      // TODO: Fetch last payment details
      console.log("Processing LAST_PAYMENT");
      break;
    case "PAY_NOW":
      // TODO: Initiate payment flow
      console.log("Processing PAY_NOW");
      break;
    case "unique-row-1":
      console.log("users selected 1")
      break;
     case "unique-row-2":
      console.log("users selected 2")
      break;
     case "unique-row-a":
      console.log("users selected A")
      break;
     case "unique-row-B":
      console.log("users selected B")
      break;
    default:
      console.log("Unknown action:", actionId);
  }
};
