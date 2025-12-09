import api from './api';

export const getCustomers = async ({page=1, limit=10}= {}) => {
    
    const response = await api.get(`/api/v1/customers?page=${page}&limit=${limit}`);
    const data = response.data;//service layer
    return data ?? []; // null check
        
    
};

export const createCustomers = async (formData)=>{
   
    const response = await api.post(`/api/v1/customers`, formData);
    return response.data;

}

export const deleteCustomerById = async(id)=>{
    const response = await api.delete(`/api/v1/customers/${id}`);
    return response.data;
}