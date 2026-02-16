import api from "./api";

export const getAllReminders = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = api.get(`/v1/reminders?${queryString}`);
    return response;
}

export const getAuditLogs = async (mobile) => {
    const response = await api.get(`/v1/reminders/audit-logs/${mobile}`);
    return response.data;
}



export const sendReminderNow = async (data) => {
    const response = await api.post("/v1/reminders/send-now", data);
    return response.data;
};

export const scheduleReminder = async (data) => {
    const response = await api.post("/v1/reminders/schedule", data);
    return response.data;
};

export const getCustomerReminder = async (customerId) => {
    const response = await api.get(`/v1/reminders/${customerId}`);
    return response.data;
}

export const deleteReminder = async (reminderId) => {
    const response = await api.delete(`/v1/reminders/${reminderId}`);
    return response.data;
}

export const rescheduleReminder = async (reminderId, scheduledFor) => {
    const response = await api.put(`/v1/reminders/reschedule/${reminderId}`, { scheduledFor });
    return response.data;
};