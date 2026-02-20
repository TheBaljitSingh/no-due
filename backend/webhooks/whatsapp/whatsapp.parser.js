export const parseWhatsappMessage = (entry) => {
  const message = entry?.changes?.[0]?.value?.messages?.[0];
  if (!message) return null;

  const base = {
    from: message.from,
    context: message.context || null
  };

  // Interactive Messages (List Reply, Button Reply)
  if (message.type === "interactive") {
    const interactive = message.interactive;

    if (interactive.type === "button_reply") {
      return {
        ...base,
        type: "BUTTON", // or "INTERACTIVE_BUTTON"
        actionId: interactive.button_reply.id,
        text: interactive.button_reply.title,
      };
    }

    if (interactive.type === "list_reply") {
      return {
        ...base,
        type: "LIST",
        actionId: interactive.list_reply.id,
        text: interactive.list_reply.title,
        description: interactive.list_reply.description
      };
    }
  }

  // Template Button Reply (Quick Reply)
  if (message.type === "button") {
    return {
      ...base,
      type: "BUTTON",
      actionId: message.button.payload, // Payload is crucial for Action ID
      text: message.button.text
    };
  }

  // Text Messages
  if (message.type === "text") {
    return {
      ...base,
      type: "TEXT",
      text: message.text.body.toLowerCase(),
    };
  }

  return null;
};
