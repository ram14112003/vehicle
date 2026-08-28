import axios from 'axios';
import config from "../config/config"; 
const BASE_URL = config.baseurl.apibaseurl;
console.log("url ax ",BASE_URL);
const axiosInstance = axios.create({
  //baseURL: BASE_URL,
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});


axiosInstance.interceptors.request.use(
  (req) => {
    const rawToken = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (rawToken && rawToken !== 'null' && rawToken !== 'undefined') {
      const cleanToken = rawToken.startsWith('Bearer ') ? rawToken.slice(7).trim() : rawToken.trim();
      if (cleanToken) {
        if (!req.headers) {
          req.headers = {} as any;
        }
        req.headers['Authorization'] = `Bearer ${cleanToken}`;
      }
    }
    return req;
  },
  (error) => {
    return Promise.reject(error);
  }
);
export default axiosInstance;