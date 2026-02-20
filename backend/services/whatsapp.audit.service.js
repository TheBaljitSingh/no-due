import Customer from "../model/customer.model.js";
import Transaction from "../model/transaction.model.js";
import WhatsappConversation from "../model/whatsappConversation.js";
import WhatsappMessage from "../model/whatsappMessage.modal.js";



class WhatsappAuditService {


    async logMessage({ mobile, direction, type, text, templateName, variables, whatsappMessageId, status, customerId, payload, responseToMessageId }) {

        try {
            console.log(`[Audit] Saving message: ${mobile} ${direction} ${type} Status: ${status}`);

            if (!mobile) return;

            // Use the text passed from the caller
            let messageText = text || `Type: ${type}`;

            // 1. Find or Create Conversation
            let conversation = await WhatsappConversation.findOne({ mobile });

            let customer = await Customer.findOne({ mobile });

            if (!conversation) {
                const linkedCustomerId = customer?._id || customerId;

                if (!linkedCustomerId) {
                    console.warn(`[Audit] No customer found for mobile ${mobile}, cannot create conversation.`);
                    //later have to decise pass or return here
                }

                conversation = await WhatsappConversation.create({
                    customerId: linkedCustomerId,
                    mobile: mobile,
                    lastMessage: messageText || type,
                    lastMessageAt: new Date(),
                    unreadCount: direction === "INBOUND" ? 1 : 0,
                });
            } else {
                // Update conversation
                conversation.lastMessage = messageText || type;
                conversation.lastMessageAt = new Date();
                if (direction === "INBOUND") {
                    conversation.unreadCount += 1;
                } else {
                    // conversation.unreadCount = 0; // Optional: reset on reply? usually yes, but maybe explicit read is better. Keeping concise.
                }
                await conversation.save();
            }

            // 2. Create Message Log
            await WhatsappMessage.create({
                mobile,
                direction,
                type,
                text: messageText,
                templateName,
                whatsappMessageId,
                status: status || (direction === "OUTBOUND" ? "sent" : "delivered"),
                timestamp: new Date(),
                customerId: conversation.customerId ? conversation.customerId.toString() : (customerId || "unknown"),
                metadata: payload || {},
                responseToMessageId: responseToMessageId
            });


            console.log(`[Audit] Logged ${direction} message for ${mobile}`);

        } catch (error) {
            console.error("[Audit] Failed to log message:", error);
        }
    }

    async updateMessageStatus(whatsappMessageId, button, error) {
        try {
            if (!whatsappMessageId) return;

            const updateData = button?.text;
            if (error) {
                updateData.error = JSON.stringify(error);
            }

            // Update the message by whatsappMessageId
            const result = await WhatsappMessage.findOneAndUpdate(
                { whatsappMessageId },
                { $set: updateData },
                { new: true }
            );

            //also i have to update the committed status in transaction
            await Transaction.findOneAndUpdate(
                { whatsappMessageId },
                { $set: { committed: true } },
                { new: true }
            );

            if (result) {
                console.log(`[Audit] Updated status for ${whatsappMessageId} to ${button?.text}`);
            } else {
                console.warn(`[Audit] Message not found for status update: ${whatsappMessageId}`);
            }

        } catch (err) {
            console.error("[Audit] Failed to update status:", err);
        }
    }
}

export default new WhatsappAuditService();
