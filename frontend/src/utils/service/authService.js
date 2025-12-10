import api from "./api";

export const loginUser = async (loginData) => {
        const response = await api.post('/v1/auth/login', loginData);
        return response.data;
};

export const googleLogin = () => {
        const baseURL = api.defaults.baseURL;
        console.log(baseURL);
        const googleLoginURL = `${baseURL}/v1/auth/google-login`;
        console.log(googleLoginURL);
        window.location.href = googleLoginURL;
};

export const checkAuth = async () => {
        const response = await api.get('/v1/auth/check-auth');
        return response.data;
};

export const logoutUser = async () => {
        const response = await api.get('/v1/auth/logout');
        return response.data;
};

export const getGoogleProfile = async () => {
        const response = await api.get('/v1/auth/profile');
        return response.data;
};