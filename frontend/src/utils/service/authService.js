import api from "./api";

export const loginUser = async (loginData) => {
        const response = await api.post('/v1/auth/login', loginData);
        return response.data;
};

export const googleLogin = async () => {
        const baseURL = api.defaults.baseURL;
        const googleLoginURL = `${baseURL}/v1/auth/google-login`;
        window.location.href = googleLoginURL;
};