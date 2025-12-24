import api from "./api"

export const getUserPaymentTerms = async ()=>{
    const response = await api.get("/v1/payment-terms/");
    return response.data;
}

export const createPaymentTerms = async (formData)=>{
    const response = await api.post("/v1/payment-terms/", formData);
    return response.data;
}

export const deletePaymentTerms = async (id)=>{
    const response = await api.delete(`/v1/payment-terms/${id}`);
    return response.data;
}

export const updatePaymentTerms = async (id)=>{
    const response = await api.put(`/v1/payment-terms/${id}`);
    return response.data;
}
