import React, { useState } from "react";
import { postJSON, saveToken } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function SignUp({ onAuthed }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const { user, token } = await postJSON("/auth/signup", form);
      saveToken(token);
      onAuthed?.(user, token);
      localStorage.setItem("auth_role", user.role);
      window.dispatchEvent(new Event('auth:changed'));
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "owner") navigate("/owner");
      else navigate("/");
    } catch (err) {
      
      const details = err.details;
      if (details?.error?.fieldErrors) {
        setFieldErrors(details.error.fieldErrors);
      }
      setError(details?.error?.message || details?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.title}>Create account</h2>

      <label style={styles.label}>
        Name
        <input
          style={styles.input}
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
        {fieldErrors.name && <small style={styles.err}>{fieldErrors.name[0]}</small>}
      </label>

      <label style={styles.label}>
        Email
        <input
          style={styles.input}
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
        />
        {fieldErrors.email && <small style={styles.err}>{fieldErrors.email[0]}</small>}
      </label>

      <label style={styles.label}>
        Password
        <input
          style={styles.input}
          type="password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          minLength={6}
          required
        />
        {fieldErrors.password && <small style={styles.err}>{fieldErrors.password[0]}</small>}
      </label>

      {error && <div style={styles.banner}>{error}</div>}

      <button style={styles.button} type="submit" disabled={loading}>
        {loading ? "Creating..." : "Sign Up"}
      </button>
    </form>
  );
}

const styles = {
  form: { maxWidth: 360, margin: "1.5rem auto", display: "grid", gap: 12 },
  title: { margin: 0 },
  label: { display: "grid", gap: 6 },
  input: { padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc" },
  button: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    cursor: "pointer",
  },
  err: { color: "#b00020" },
  banner: { color: "#b00020", background: "#fde7ea", padding: "8px 10px", borderRadius: 8 },
};
