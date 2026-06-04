import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000/api',
    withCredentials: true, // Crucial for express-session cookie syncing
    headers: {
        'Content-Type': 'application/json',
    }
});

// ADD THIS DEBUGGER INTERCEPTOR:
axiosInstance.interceptors.request.use((config) => {
    // If the URL is blank, empty, or just a slash, log a warning with a stack trace
    if (!config.url || config.url === '/' || config.url === '') {
        console.warn(
            `🚨 WARNING: An empty API request was intercepted! It is defaulting to the base /api endpoint.`,
            `Check the call stack below to find the component script file:`,
            new Error().stack
        );
    } else {
        console.log(`✈️ Outgoing API Request: ${config.method.toUpperCase()} -> ${config.baseURL}${config.url}`);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default axiosInstance;