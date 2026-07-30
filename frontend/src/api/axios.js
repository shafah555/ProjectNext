import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://projectnext-qzwa.onrender.com",
  // 45 s — Render free-tier cold start (~50s worst case) can stack with Neon's
  // own compute auto-suspend/wake (a few extra seconds on the first query),
  // so 15s was timing out before either had a chance to finish waking up.
  timeout: 45000,
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