import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://projectnext-qzwa.onrender.com",
  timeout: 15000, // 15 s — covers Render free-tier cold-start wake-up
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pn_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only auto-redirect to /login for 401 errors that occur on
    // authenticated pages, not on auth pages themselves (/login, /register).
    const isAuthPage =
      window.location.pathname.startsWith("/login") ||
      window.location.pathname.startsWith("/register");

    if (err.response?.status === 401 && !isAuthPage) {
      localStorage.removeItem("pn_token");
      localStorage.removeItem("pn_user");
      window.location.href = "/login";
    }

    // Surface a cleaner message when the request never reached the server
    // (CORS block, server offline, network issue, cold-start timeout, etc.)
    if (!err.response) {
      err.userMessage =
        "Cannot reach the server. It may be starting up — please wait 30 seconds and try again.";
    }

    return Promise.reject(err);
  }
);

export default api;