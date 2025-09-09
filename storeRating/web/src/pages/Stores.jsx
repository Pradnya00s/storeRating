import { useEffect, useState } from "react";
import StoreCard from "../components/StoreCard";
import api from "../api/client";

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.get("/stores");
        if (!mounted) return;
        setStores(data.stores || []);
      } catch (e) {
        setErr(e.message || "Failed to load stores");
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  
  const handleOverallRate = (storeId, newUserRating) => {
    setStores((prev) =>
      prev.map((s) =>
        s.id === storeId ? { ...s, user_rating: newUserRating } : s
      )
    );
  };

  if (loading) return <p>Loading stores...</p>;
  if (err) return <p style={{ color: "red" }}>{err}</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Stores</h2>
      {stores.length === 0 ? (
        <p>No stores available</p>
      ) : (
        <div className="stores-section">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onOverallRate={handleOverallRate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
