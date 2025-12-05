import api from './api';

export const getCustomers = async ({page=1, limit=10}= {}) => {
    
    try {
        const response = await api.get(`/api/v1/customers?page=${page}&limit=${limit}`);
        const data = response.data.data;//service layer
        return data ?? [];
        
    } catch (error) {
        throw error;
    }
};

export const createCustomers = async (formData)=>{
    try {
        const response = await api.post(`/api/v1/customers`, {formData});

        if(!response.data.success){
            return false;
        }
        return true;


    } catch (error) {
        console.log(error);

        throw error;
        
    }
}