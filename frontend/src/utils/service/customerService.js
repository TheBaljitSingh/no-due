import api from './api';

export const getCustomers = async () => {
    try {
        const response = await api.get('/customers');
        return response.data;
    } catch (error) {
        throw error;
    }
};