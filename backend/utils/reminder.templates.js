import { formatDate } from "./Helper.js";
import User from "../model/user.model.js";

export const REMINDER_TEMPLATE_NAMES = {
    //en_US 
    INTERACTIVE_BEFORE_DUE: 'interactive_before_due1',
    INTERACTIVE_DUE_TODAY: 'interactive_due_today',
    INTERACTIVE_OVERDUE: 'interactive_overdue',
};


/**
 * Fetches custom template name and language from user's WhatsApp settings
 * Falls back to predefined template if not configured
 * @param {string} userId - The user/merchant ID
 * @param {string} templateType - 'beforeDue', 'dueToday', or 'overdue'
 * @param {string} defaultTemplate - Default template name to use as fallback
 * @returns {Promise<{name: string, language: string}>} Template name and language to use
 */
const getTemplateNameFromUser = async (userId, templateType, defaultTemplate) => {
    try {
        if (!userId) {
            return { name: defaultTemplate, language: 'en' };
        }

        const user = await User.findById(userId).select('whatsapp.reminderTemplates');

        if (user?.whatsapp?.reminderTemplates?.[templateType]?.name) {
            const templateConfig = user.whatsapp.reminderTemplates[templateType];
            console.log("user saved data of template", templateConfig);
            return {
                name: templateConfig.name,
                language: templateConfig.language || 'en'
            };
        }

        return { name: defaultTemplate, language: 'en' };
    } catch (error) {
        console.error(`Error fetching template for user ${userId}:`, error);
        return { name: defaultTemplate, language: 'en' };
    }
};

export const getBeforeDueTemplate = async (name, amount, dueDate, companyName, userId = null) => {
    const templateConfig = await getTemplateNameFromUser(
        userId,
        'beforeDue',
        REMINDER_TEMPLATE_NAMES.INTERACTIVE_BEFORE_DUE
    );

    return {
        templateName: templateConfig.name,
        language: templateConfig.language,
        variables: { "name": name, "amount": amount, "duedate": formatDate(dueDate), "companyname": companyName }
    };
};

export const getDueTodayTemplate = async (name, amount, dueDate, companyName, userId = null) => {
    const templateConfig = await getTemplateNameFromUser(
        userId,
        'dueToday',
        REMINDER_TEMPLATE_NAMES.INTERACTIVE_DUE_TODAY
    );

    return {
        templateName: templateConfig.name,
        language: templateConfig.language,
        variables: { "name": name, "amount": amount, "duedate": formatDate(dueDate), "companyname": companyName }
    };
};

export const getOverdueTemplate = async (name, amount, dueDate, companyName, userId = null) => {
    const templateConfig = await getTemplateNameFromUser(
        userId,
        'overdue',
        REMINDER_TEMPLATE_NAMES.INTERACTIVE_OVERDUE
    );

    return {
        templateName: templateConfig.name,
        language: templateConfig.language,
        variables: { "name": name, "amount": amount, "duedate": formatDate(dueDate), "companyname": companyName }
    };
};
