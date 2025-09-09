import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { token, logout, isAuthenticated } = useAuth();
  const [role, setRole] = useState(() => (localStorage.getItem("user_role") || "").toLowerCase());
  const navigate = useNavigate();

  useEffect(() => {
    const syncRole = () => setRole((localStorage.getItem("auth_role") || "").toLowerCase());
    window.addEventListener("storage", syncRole);
    window.addEventListener("auth:changed", syncRole);
    syncRole();
    return () => {
      window.removeEventListener("storage", syncRole);
      window.removeEventListener("auth:changed", syncRole);
    };
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("auth_role");
    setRole("");
    window.dispatchEvent(new Event("auth:changed"));
    navigate("/");
  };

  const authed = isAuthenticated();

  return (
    <nav style={{ padding: "1rem", backgroundColor: "#f5f5f5", marginBottom: "2rem" }}>
      <Link to="/" style={{ marginRight: "1rem" }}>Home</Link>

      {!authed && (
        <>
          <Link to="/login" style={{ marginRight: "1rem" }}>Login</Link>
          <Link to="/signup" style={{ marginRight: "1rem" }}>Signup</Link>
        </>
      )}

      <Link to="/stores" style={{ marginRight: "1rem" }}>Stores</Link>

      {authed && (
        <>
          {/* Role-based links */}
          {role === "admin" && (
            <Link to="/admin" style={{ marginRight: "1rem" }}>Admin</Link>
          )}
          {role === "owner" && (
            <Link to="/owner" style={{ marginRight: "1rem" }}>Owner</Link>
          )}

          <Link to="/profile" style={{ marginRight: "1rem" }}>Profile</Link>
          <button onClick={handleLogout} style={{ marginLeft: "1rem" }}>
            Logout
          </button>
        </>
      )}
    </nav>
  );
}
