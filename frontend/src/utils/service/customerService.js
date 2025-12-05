import api from './api';

export const getCustomers = async ({page=1, limit=10}) => {
    try {
        const response = await api.get(`/api/v1/customers?page=${page}&?limit=${limit}`);
        const customers = response.data.data;//service layer
        if(!customers.length){
            return {};
        }else{
            return customers;
        }
    } catch (error) {
        throw error;
    }
};