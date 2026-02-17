import api from "./api";

export const registerUser = async (userData) => {
        const response = await api.post('/v1/user', userData);
        return response.data;
};

export const updateUser = async (updatedData) => {
        const response = await api.put('/v1/user', updatedData);
        return response.data;
};

export const updatePassword = async (passwordData) => {
        const response = await api.put('/v1/user/password', passwordData);
        return response.data;
};

export const getDueTransactionsSummary = async ({ page = 1, limit = 10 }) => {
        const response = await api.get(`/v1/user/all-transactions?page=${page}&limit=${limit}`);
        return response.data;
};