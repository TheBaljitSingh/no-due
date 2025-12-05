import api from "../service/api.js";

export const getUserProfile = async () => {
    try {
        const response = await api.get('/api/v1/auth/me');
        return response.data;
    } catch (error) {
        throw error;
    }
};


export const registerUser = async(data)=>{
    try {
        const response = await api.post("/api/v1/auth/register", data); //check how body will be passed
        
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
        
    }
}

