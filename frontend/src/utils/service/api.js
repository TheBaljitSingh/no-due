import axios from 'axios';

const PRODUCTION_SERVERS=[`${import.meta.env.VITE_API_BASE_URL}/api`];

let currentServerIndex=0;

const getBaseURL=()=>{
    if(window.location.hostname==='localhost' || window.location.hostname==='127.0.0.1'){
        return 'http://localhost:3000/api';
    }
    return PRODUCTION_SERVERS[currentServerIndex] 
};

console.log(getBaseURL());

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
    withCredentials: true,
});

api.interceptors.response.use(
    (config) =>{
        console.log('making request to',config.baseURL + config.url);
        return config;
    },
    (error) => {
        console.error('API Error:', error.response ? error.response.data : error.message);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const isServerError = error.response && error.response.status >= 500 && error.response.status < 600;
        const isProduction = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
        const hasMoreServers = currentServerIndex < PRODUCTION_SERVERS.length - 1;

        if (isServerError && isProduction && hasMoreServers && !originalRequest._retry) {
            console.warn(`Switching server from ${PRODUCTION_SERVERS[currentServerIndex]} due to error.`);
            currentServerIndex += 1;
            api.defaults.baseURL = PRODUCTION_SERVERS[currentServerIndex];
            originalRequest.baseURL = api.defaults.baseURL;
            originalRequest._retry = true;

            console.log(`Retrying request to ${originalRequest.baseURL + originalRequest.url}`);
            return api(originalRequest);
        }

        if(error.response){
            const {status,data}=error.response;
            console.error(`API Error ${status}:`, data?.message || error.message );
             switch (status) {
        case 400:
          console.warn("Bad Request:", data?.message);
          break;
        case 403:
          console.warn(":", data?.message);
          break;
        case 404:
          console.warn("Not Found:", data?.message);
          break;
        case 500:
          console.error("Server Error:", data?.message);
          break;
        case 509:
          console.warn("Conflict:", data?.message);
          break;
        default:
          console.warn("Unhandled Error:", data?.message);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error("No response received from server:", error.message);
    } else {
      // Something else went wrong
      console.error("API Setup Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
