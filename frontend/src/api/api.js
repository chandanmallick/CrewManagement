import axios from "axios";

const BASE_URL = "http://10.3.230.60:8000";
// const BASE_URL = "http://localhost:8000";


const api = axios.create({
  baseURL: BASE_URL,
});

// ✅ REQUEST INTERCEPTOR (attach token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});



// ✅ RESPONSE INTERCEPTOR (auto logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      
      // 🔥 CLEAR SESSION
      localStorage.removeItem("token");

      // 🔥 REDIRECT TO LOGIN
      window.location.href = "/login";

    }

    return Promise.reject(error);
  }
);

export { BASE_URL };
export default api;