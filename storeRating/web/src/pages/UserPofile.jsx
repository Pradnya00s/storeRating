import React, { useEffect, useState } from "react";
import api from "../api/client";

export default function UserProfile() {
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [errMe, setErrMe] = useState("");

  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.get("/auth/me");
        if (!mounted) return;
        setMe(data.user || null);
      } catch (e) {
        setErrMe(" ");
      } finally {
        setLoadingMe(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    const { current_password, new_password, confirm_password } = form;
    if (!current_password || !new_password || !confirm_password) {
      return "All fields are required.";
    }
    if (new_password.length < 6) {
      return "New password must be at least 6 characters.";
    }
    if (new_password === current_password) {
      return "New password must be different from current password.";
    }
    if (new_password !== confirm_password) {
      return "New password and confirm password do not match.";
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    const v = validate();
    if (v) { setMsg(v); return; }

    try {
      setSubmitting(true);
      const { current_password, new_password } = form;
      const res = await api.post("/auth/change-password", {
        current_password,
        new_password
      });

      
      if (res.token) {
        localStorage.setItem("auth_token", res.token);
        
        window.dispatchEvent(new Event("storage"));
      }

      setMsg("✅ Password updated successfully.");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (e) {
      setMsg(`❌ ${e.message || "Failed to change password"}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <h2>User Profile</h2>

      {/* Profile info  */}
      {!loadingMe && me && (
        <div style={styles.card}>
          <div><strong>Name:</strong> {me.name}</div>
          <div><strong>Email:</strong> {me.email}</div>
          {me.role && <div><strong>Role:</strong> {me.role}</div>}
        </div>
      )}

      {/* Change Password */}
      <section style={{ marginTop: 16 }}>
        <h3>Change Password</h3>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Current Password
            <input
              name="current_password"
              type="password"
              value={form.current_password}
              onChange={onChange}
              style={styles.input}
              autoComplete="current-password"
              required
            />
          </label>

          <label style={styles.label}>
            New Password
            <input
              name="new_password"
              type="password"
              value={form.new_password}
              onChange={onChange}
              style={styles.input}
              autoComplete="new-password"
              required
            />
          </label>

          <label style={styles.label}>
            Confirm New Password
            <input
              name="confirm_password"
              type="password"
              value={form.confirm_password}
              onChange={onChange}
              style={styles.input}
              autoComplete="new-password"
              required
            />
          </label>

          {msg && (
            <div style={{
              marginTop: 8,
              color: msg.startsWith("✅") ? "green" : "crimson"
            }}>
              {msg}
            </div>
          )}

          <button type="submit" style={styles.button} disabled={submitting}>
            {submitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 600, margin: "1.5rem auto", padding: "0 1rem" },
  card: { border: "1px solid #ddd", borderRadius: 12, padding: 16, background: "#fafafa", marginBottom: 12, color: "#333" },
  form: { display: "grid", gap: 10, maxWidth: 500 },
  label: { display: "grid", gap: 6, fontSize: 14 },
  input: { padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc" },
  button: { padding: "10px 12px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer" }
};
