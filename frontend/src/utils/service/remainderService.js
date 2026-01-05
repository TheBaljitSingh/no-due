import api from "./api";

export const getAllRemainders = async () => {
    const response = api.get("/v1/remainders");
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

export const getCustomerReminder = async (customerId)=>{
    const response = await api.get(`/v1/remainders/${customerId}`);
    return response.data;
}