import axios from "axios";

const api = axios.create({
  baseURL: "http://10.3.230.60:8000", // adjust
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

export default api;