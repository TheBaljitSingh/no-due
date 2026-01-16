
import { formatDate } from "./Helper.js";

export const REMINDER_TEMPLATE_NAMES = {
    INTERACTIVE_BEFORE_DUE: "interactive_before_due",
    INTERACTIVE_DUE_TODAY: "interactive_due_today",
    INTERACTIVE_OVERDUE: "interactive_overdue",
};

export const getBeforeDueMessage = (name, amount, dueDate, companyName) => {
    return {
        type: "list",
        body: {
text: `Dear ${name},
This is a reminder that ₹${amount} is due on ${formatDate(dueDate)}.
Please let us know your payment plan by selecting an option below.
If payment has already been made, please ignore this message.

Thanks,
${companyName}`
        },
        action: {
            button: "Select Response",
            sections: [
                {
                    title: "Payment Options",
                    rows: [
                        { id: "PAY_TODAY", title: "I will pay today" },
                        { id: "PAY_WEEK", title: "I will pay within a week" },
                        { id: "PAY_SOON", title: "I will pay soon" },
                        { id: "NEED_STATEMENT", title: "Need statement" }
                    ]
                }
            ]
        }
    };
};

export const getDueTodayMessage = (name, amount, dueDate, companyName) => {
    return {
        type: "list",
        body: {
text: `Dear ${name},
This is a reminder that ₹${amount} is due today (${formatDate(dueDate)}).
Kindly update the payment status by selecting an option below.
If payment has already been made, please ignore this message.

Thanks,
${companyName}`
        },
        action: {
            button: "Select Response",
            sections: [
                {
                    title: "Payment Options",
                    rows: [
                        { id: "PAID_TODAY", title: "Paid today" },
                        { id: "WILL_PAY_TODAY", title: "Will pay today" },
                        { id: "PAY_WEEK", title: "Will pay within a week" },
                        { id: "NEED_STATEMENT", title: "Need statement" }
                    ]
                }
            ]
        }
    };
};

export const getOverdueMessage = (name, amount, dueDate, companyName) => {
    return {
        type: "list",
        body: {
text: `Dear ${name},
This is a follow-up regarding ₹${amount}, which was due on ${formatDate(dueDate)} and is currently pending.
Please select an option below to update the payment status.
If payment has already been made, please ignore this message.

Thanks,
${companyName}`
        },
        action: {
            button: "Select Response",
            sections: [
                {
                    title: "Payment Options",
                    rows: [
                        { id: "WILL_PAY_TODAY", title: "Will pay today" },
                        { id: "PAY_WEEK", title: "Will pay within a week" },
                        { id: "PAY_SOON", title: "Will pay soon" },
                        { id: "NEED_STATEMENT", title: "Need statement" }
                    ]
                }
            ]
        }
    };
};
