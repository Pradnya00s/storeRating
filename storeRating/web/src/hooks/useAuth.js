import { useState, useEffect } from "react";

export default function useAuth() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) setToken(savedToken);
  }, []);

  const login = (newToken) => {
    localStorage.setItem("auth_token", newToken);
    console.log("Setting token in useAuth:", newToken);
    console.log('isAuthenticated:', isAuthenticated());
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
  };

  const isAuthenticated = () => {
    const authToken = localStorage.getItem("auth_token");
    return !!authToken;
  };

  return { token, login, logout, isAuthenticated };
}
