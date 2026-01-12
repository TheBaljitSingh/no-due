import api from "./api";

export const getAllRemainders = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = api.get(`/v1/remainders?${queryString}`);
    return response;
}

export const sendReminderNow = async (data) => {
    const response = await api.post("/v1/remainders/send-now", data);
    return response.data;
};

export const scheduleReminder = async (data) => {
    const response = await api.post("/v1/remainders/schedule", data);
    return response.data;
};

export const getCustomerReminder = async (customerId) => {
    const response = await api.get(`/v1/remainders/${customerId}`);
    return response.data;
}

export const deleteReminder = async (reminderId) => {
    const response = await api.delete(`/v1/remainders/${reminderId}`);
    return response.data;
}

export const rescheduleReminder = async (reminderId, scheduledFor) => {
    const response = await api.put(`/v1/remainders/reschedule/${reminderId}`, { scheduledFor });
    return response.data;
};