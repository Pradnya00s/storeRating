import React, { useEffect, useMemo, useState } from "react";
import api from "../api/client";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total_users: 0, total_stores: 0, total_ratings: 0 });


  const [tab, setTab] = useState("users");

  
  const [users, setUsers] = useState([]);
  const [uLoading, setULoading] = useState(false);
  const [uErr, setUErr] = useState("");
  const [uQuery, setUQuery] = useState("");
  const [uRole, setURole] = useState("");

  
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", address: "", role: "user" });
  const [newUserMsg, setNewUserMsg] = useState("");

  
  const [stores, setStores] = useState([]);
  const [sLoading, setSLoading] = useState(false);
  const [sErr, setSErr] = useState("");
  const [sQuery, setSQuery] = useState("");


  const [showStoreModal, setShowStoreModal] = useState(false);
  const [newStore, setNewStore] = useState({ name: "", email: "", address: "", owner_email: "" });
  const [newStoreMsg, setNewStoreMsg] = useState("");

  
  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const data = await api.get("/admin/stats");
        if (m) setStats(data);
      } catch (_) {}
    })();
    return () => (m = false);
  }, []);


  async function fetchUsers() {
    setULoading(true);
    setUErr("");
    try {
      const q = new URLSearchParams();
      if (uQuery) q.set("q", uQuery);
      if (uRole) q.set("role", uRole);
      const data = await api.get(`/admin/users?${q.toString()}`);
      setUsers(data.users || []);
    } catch (e) {
      setUErr(e.message || "Failed to load users");
    } finally {
      setULoading(false);
    }
  }
  useEffect(() => { fetchUsers(); /* initial */ }, []); 
  
  async function fetchStores() {
    setSLoading(true);
    setSErr("");
    try {
      const q = new URLSearchParams();
      if (sQuery) q.set("q", sQuery);
      const data = await api.get(`/admin/stores?${q.toString()}`);
      setStores(data.stores || []);
    } catch (e) {
      setSErr(e.message || "Failed to load stores");
    } finally {
      setSLoading(false);
    }
  }
  useEffect(() => { fetchStores(); /* initial */ }, []); 

  async function handleCreateUser(e) {
    e.preventDefault();
    setNewUserMsg("");
    try {
      const payload = { ...newUser };
      const res = await api.post("/admin/users", payload);
      setNewUserMsg(`✅ user created: ${res.user.email}`);
      await Promise.all([fetchUsers(), api.get("/admin/stats").then(setStats)]);
      setTimeout(() => {
        setShowUserModal(false);
        setNewUser({ name: "", email: "", password: "", address: "", role: "user" });
        setNewUserMsg("");
      }, 800);
    } catch (e) {
      setNewUserMsg(`❌ ${e.message}`);
    }
  }

  async function handleCreateStore(e) {
    e.preventDefault();
    setNewStoreMsg("");
    try {
      const payload = {
        name: newStore.name,
        email: newStore.email || null,
        address: newStore.address || null,
        owner_email: newStore.owner_email || null,
      };
      const res = await api.post("/admin/stores", payload);
      setNewStoreMsg(`✅ store created: ${res.store.name}`);
      await Promise.all([fetchStores(), api.get("/admin/stats").then(setStats)]);
      setTimeout(() => {
        setShowStoreModal(false);
        setNewStore({ name: "", email: "", address: "", owner_email: "" });
        setNewStoreMsg("");
      }, 800);
    } catch (e) {
      setNewStoreMsg(`❌ ${e.message}`);
    }
  }

  const roles = useMemo(() => ["", "user", "admin", "owner"], []);

  return (
    <div style={styles.wrap}>
      <h2>Admin Dashboard</h2>

      {/* Stats */}
      <section style={styles.cardRow}>
        <StatCard label="Total Users" value={stats.total_users} />
        <StatCard label="Total Stores" value={stats.total_stores} />
        <StatCard label="Total Ratings" value={stats.total_ratings} />
      </section>

      {/* Tabs */}
      <div role="tablist" aria-label="Admin sections" style={styles.tabs}>
        <button
          role="tab"
          aria-selected={tab === "users"}
          onClick={() => setTab("users")}
          style={{ ...styles.tab, ...(tab === "users" ? styles.tabActive : {}) }}
        >
          Users
        </button>
        <button
          role="tab"
          aria-selected={tab === "stores"}
          onClick={() => setTab("stores")}
          style={{ ...styles.tab, ...(tab === "stores" ? styles.tabActive : {}) }}
        >
          Stores
        </button>
      </div>

      {/* Users TAB */}
      {tab === "users" && (
        <section style={styles.section} role="tabpanel" aria-label="Users">
          <div style={styles.sectionHead}>
            <h3 style={{ margin: 0 }}>Users</h3>
            <button style={styles.primary} onClick={() => setShowUserModal(true)}>+ Add User</button>
          </div>
          <div style={styles.controls}>
            <input
              placeholder="Search name/email/address"
              value={uQuery}
              onChange={(e) => setUQuery(e.target.value)}
              style={styles.input}
            />
            <select value={uRole} onChange={(e) => setURole(e.target.value)} style={styles.input}>
              {roles.map(r => <option key={r} value={r}>{r || "All roles"}</option>)}
            </select>
            <button onClick={fetchUsers} style={styles.button}>Filter</button>
          </div>
          {uLoading ? <p>Loading users…</p> : uErr ? <p style={styles.err}>{uErr}</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Address</th><th>Role</th><th>Created</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.address || "—"}</td>
                      <td>{u.role}</td>
                      <td>{new Date(u.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Stores TAB */}
      {tab === "stores" && (
        <section style={styles.section} role="tabpanel" aria-label="Stores">
          <div style={styles.sectionHead}>
            <h3 style={{ margin: 0 }}>Stores</h3>
            <button style={styles.primary} onClick={() => setShowStoreModal(true)}>+ Add Store</button>
          </div>
          <div style={styles.controls}>
            <input
              placeholder="Search name/email/address"
              value={sQuery}
              onChange={(e) => setSQuery(e.target.value)}
              style={styles.input}
            />
            <button onClick={fetchStores} style={styles.button}>Filter</button>
          </div>
          {sLoading ? <p>Loading stores…</p> : sErr ? <p style={styles.err}>{sErr}</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Address</th><th>Rating</th><th>Ratings Count</th></tr>
                </thead>
                <tbody>
                  {stores.map(s => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.email || "—"}</td>
                      <td>{s.address || "—"}</td>
                      <td>{s.rating != null ? Number(s.rating).toFixed(1) : "—"}</td>
                      <td>{s.ratings_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Add User Modal */}
      <Modal open={showUserModal} onClose={() => setShowUserModal(false)} title="Add New User">
        <form onSubmit={handleCreateUser} style={styles.grid}>
          <input required placeholder="Name" value={newUser.name}
                 onChange={(e)=>setNewUser(v=>({...v,name:e.target.value}))} style={modalStyles.input}/>
          <input required type="email" placeholder="Email" value={newUser.email}
                 onChange={(e)=>setNewUser(v=>({...v,email:e.target.value}))} style={modalStyles.input}/>
          <input required type="password" placeholder="Password" value={newUser.password}
                 onChange={(e)=>setNewUser(v=>({...v,password:e.target.value}))} style={modalStyles.input}/>
          <input placeholder="Address" value={newUser.address}
                 onChange={(e)=>setNewUser(v=>({...v,address:e.target.value}))} style={modalStyles.input}/>
          <select value={newUser.role} onChange={(e)=>setNewUser(v=>({...v,role:e.target.value}))} style={modalStyles.input}>
            <option value="user">user</option>
            <option value="admin">admin</option>
            <option value="owner">owner</option>
          </select>

          {newUserMsg && <p style={{ margin: 0, color: newUserMsg.startsWith("✅") ? "green" : "red" }}>{newUserMsg}</p>}
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button type="button" onClick={()=>setShowUserModal(false)} style={styles.button}>Cancel</button>
            <button type="submit" style={styles.primary}>Create User</button>
          </div>
        </form>
      </Modal>

      {/* Add Store Modal */}
      <Modal open={showStoreModal} onClose={() => setShowStoreModal(false)} title="Add New Store">
        <form onSubmit={handleCreateStore} style={styles.grid}>
          <input required placeholder="Name" value={newStore.name}
                 onChange={(e)=>setNewStore(v=>({...v,name:e.target.value}))} style={modalStyles.input}/>
          <input placeholder="Email" value={newStore.email}
                 onChange={(e)=>setNewStore(v=>({...v,email:e.target.value}))} style={modalStyles.input}/>
          <input placeholder="Address" value={newStore.address}
                 onChange={(e)=>setNewStore(v=>({...v,address:e.target.value}))} style={modalStyles.input}/>
          <input placeholder="Owner Email (optional, must be an owner)" value={newStore.owner_email}
                 onChange={(e)=>setNewStore(v=>({...v,owner_email:e.target.value}))} style={modalStyles.input}/>

          {newStoreMsg && <p style={{ margin: 0, color: newStoreMsg.startsWith("✅") ? "green" : "red" }}>{newStoreMsg}</p>}
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button type="button" onClick={()=>setShowStoreModal(false)} style={styles.button}>Cancel</button>
            <button type="submit" style={styles.primary}>Create Store</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={styles.card}>
      <div style={{ fontSize: 12, color: "#555" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  React.useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose?.(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={title} style={modalStyles.backdrop} onClick={onClose}>
      <div style={modalStyles.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={modalStyles.close} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 1000, margin: "1.5rem auto", padding: "0 1rem" },
  section: { marginTop: 24 },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  tabs: { display: "flex", gap: 8, borderBottom: "1px solid #e5e5e5", marginTop: 16 },
  tab: {
    padding: "8px 12px",
    border: "1px solid transparent",
    borderBottom: "2px solid transparent",
    borderRadius: "8px 8px 0 0",
    background: "transparent",
    cursor: "pointer",
    color: "#555"
  },
  tabActive: { color: "#111", borderColor: "#e5e5e5", borderBottomColor: "#111", background: "#f9f9f9" },
  controls: { display: "flex", gap: 20, alignItems: "center", marginBottom: 10, flexWrap: "wrap" },
  input: { padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc" },
  button: { padding: "8px 12px", borderRadius: 8, border: "1px solid #444", background: "#fff", color: "#111", cursor: "pointer" },
  primary: { padding: "8px 12px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse" },
  err: { color: "crimson" },
  cardRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 12, marginTop: 12, color: "#333" },
  card: { border: "1px solid #ddd", borderRadius: 12, padding: 16, background: "#fafafa" },
  grid: { display: "grid", gap: 20, maxWidth: 680, marginTop: 10 },
};

const modalStyles = {
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    display: "grid", placeItems: "center", padding: "1rem", zIndex: 9999
  },
  sheet: {
    width: "min(640px, 100%)", background: "#fff", borderRadius: 12, padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
  },
  input: { padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc", backgroundColor: "#ebebeb", color: "#333" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, color: "#333" },
  close: { border: "none", background: "transparent", fontSize: 18, cursor: "pointer", color: "#555" },
};
