import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("pn_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("pn_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/api/auth/me")
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem("pn_user", JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem("pn_token");
        localStorage.removeItem("pn_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("pn_token", data.token);
    localStorage.setItem("pn_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function register(name, email, password) {
    const { data } = await api.post("/api/auth/register", { name, email, password });
    localStorage.setItem("pn_token", data.token);
    localStorage.setItem("pn_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("pn_token");
    localStorage.removeItem("pn_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
