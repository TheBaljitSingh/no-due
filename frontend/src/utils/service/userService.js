import api from "./api";

export const getUserProfile = async () => {
    try {
        const response = await api.get('/v1/user/profile');
        return response.data;
    } catch (error) {
        throw error;
    }
};
