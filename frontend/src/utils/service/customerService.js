import api from "./api"
export const getCustomers = async ({ page = 1, limit = 10 } = {}) => {
    const response = await api.get(`/v1/customers?page=${page}&limit=${limit}`);
    return response.data ?? [];
};

export const createCustomers = async (formData) => {
    const response = await api.post(`/v1/customers`, formData);
    return response.data;
};

export const deleteCustomerById = async (id) => {
    const response = await api.delete(`/v1/customers/${id}`);
    return response.data;
};

export const getAllcustomers = async () => {
    const response = await api.get(`/v1/customers?limit=all`);
    return response.data;
};

export const getCustomerById = async (id) => {
    const response = await api.get(`/v1/customers/${id}`);
    return response.data;
};


export const addDueToCustomer = async (customerId, data) => {
    const response = await api.post(`/v1/customers/${customerId}/add-due`, data);
    return response.data;
};

export const addPaymentForCustomer = async (customerId,data) => {
    const response = await api.post(`/v1/customers/${customerId}/add-payment`, data);
    return response.data;
};

export const editCustomerDue = async (customerId, data) => {
    const response = await api.post(`/v1/customers/${customerId}/edit-due`, data);
    return response.data;
};

export const getCustomerTransactions = async (customerId) => {
    const response = await api.get(`/v1/customers/${customerId}/transactions`);
    return response.data ?? [];
};

export const updatecustomer = async(id, updatedData)=>{
    console.log(id, updatedData);
    const response = await api.put(`/v1/customers/${id}`, updatedData);
    return response.data;
}
