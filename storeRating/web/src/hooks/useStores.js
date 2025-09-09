import { useState, useEffect } from "react";
import api from "../api/client";

export default function useStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await api.get("/api/ratings"); // adjust endpoint if needed
        setStores(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch stores");
      } finally {
        setLoading(false);
      }
    }

    fetchStores();
  }, []);

  return { stores, loading, error };
}
