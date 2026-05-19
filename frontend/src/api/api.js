import axios from "axios";

// export const BASE_URL = "http://localhost:8000";
export const BASE_URL = "http://10.3.230.60:8000";

const api = axios.create({
  baseURL: BASE_URL,
});


// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(

  (response) => response,

  (error) => {

    // 🔥 TOKEN EXPIRED / INVALID
    if (
      error.response &&
      error.response.status === 401
    ) {

      // Prevent multiple alerts
      if (!window.__sessionExpiredShown) {

        window.__sessionExpiredShown = true;

        alert("Session expired. Please login again.");
      }

      // Clear everything
      localStorage.clear();

      // Redirect to login
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;