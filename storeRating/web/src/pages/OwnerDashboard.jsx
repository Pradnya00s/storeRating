import React, { useEffect, useState } from "react";
import api from "../api/client";

export default function OwnerDashboard() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selectedStore, setSelectedStore] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [rLoading, setRLoading] = useState(false);
  const [rErr, setRErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get("/owner/stores");
        setStores(data.stores || []);
      } catch (e) {
        setErr(e.message || "Failed to load stores");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function openRatings(store) {
    setSelectedStore(store);
    setRatings([]);
    setRLoading(true);
    setRErr("");
    try {
      const data = await api.get(`/owner/stores/${store.id}/ratings`);
      setRatings(data.ratings || []);
    } catch (e) {
      setRErr(e.message || "Failed to load ratings");
    } finally {
      setRLoading(false);
    }
  }

  if (loading) return <p>Loading owner stores…</p>;
  if (err) return <p style={{ color: "crimson" }}>{err}</p>;

  return (
    <div style={{ maxWidth: 900, margin: "1.5rem auto", padding: "0 1rem" }}>
      <h2>Owner Dashboard</h2>

      {stores.length === 0 ? (
        <p>No stores yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Address</th><th>Avg Rating</th><th>Ratings</th><th></th></tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.email || "—"}</td>
                  <td>{s.address || "—"}</td>
                  <td>{s.average_rating != null ? Number(s.average_rating).toFixed(1) : "—"}</td>
                  <td>{s.ratings_count || 0}</td>
                  <td><button style={styles.button} onClick={() => openRatings(s)}>View Ratings</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedStore && (
        <div style={{ marginTop: 20 }}>
          <h3>Ratings for: {selectedStore.name}</h3>
          {rLoading ? <p>Loading ratings…</p> : rErr ? <p style={{ color: "crimson" }}>{rErr}</p> : (
            ratings.length ? (
              <ul style={{ paddingLeft: 18 }}>
                {ratings.map(r => (
                  <li key={r.id}>
                    <strong>{r.rating}★</strong> by user {r.user_id} — {new Date(r.created_at).toLocaleString()}
                  </li>
                ))}
              </ul>
            ) : <p>No ratings yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  table: { width: "100%", borderCollapse: "collapse" },
  button: { padding: "6px 10px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer" },
};
