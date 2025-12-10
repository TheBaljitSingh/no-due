import api from "./api";

export const registerUser = async (userData) => {
        const response = await api.post('/v1/user', userData);
        return response.data;
};