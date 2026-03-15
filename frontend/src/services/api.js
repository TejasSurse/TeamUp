import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://team-up-backend-b6sd.vercel.app/api'
});

export default api;
