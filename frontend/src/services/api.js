import axios from "axios";

const API_URL = "https://p2p-payment-platform.onrender.com/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  getCurrentUser: () => api.get("/auth/me"),
};

// Wallet API calls
export const walletAPI = {
  getBalance: () => api.get("/wallet/balance"),
  deposit: (amount) => api.post("/wallet/deposit", { amount }),
  withdraw: (amount) => api.post("/wallet/withdraw", { amount }),
};

// Transaction API calls
export const transactionAPI = {
  send: (data) => api.post("/transactions/send", data),
  getHistory: () => api.get("/transactions"),
  searchUsers: (email) =>
    api.get("/transactions/users/search", { params: { email } }),
};

export default api;
