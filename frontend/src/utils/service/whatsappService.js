import api from "./api"
export const whatsappReply = async(payload)=>{
    const response = await api.post('/v1/whatsapp/reply', payload);
    return response.data;
}

export const getChatHistory = async (mobile)=>{
    const response = await api.get(`/v1/whatsapp/history?mobile=${mobile}`);
    return response.data;
}

export const getAllconversations = async ()=>{
    const response = await api.get(`/v1/whatsapp/conversations`);
    return response.data;
}