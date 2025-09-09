import { useEffect, useState } from "react";
import RatingStars from "./RatingStars";
import api from "../api/client";

export default function StoreCard({ store, onOverallRate }) {
  const [userRating, setUserRating] = useState(store.user_rating || 0);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setUserRating(store.user_rating || 0);
  }, [store.user_rating]);

  const handleRate = async (rating) => {
    setUserRating(rating);
    setMessage("");

    try {
      await api.post(`/stores/${store.id}/ratings`, { rating });
      setMessage("Rating submitted!");
      onOverallRate?.(store.id, rating);
    } catch (err) {
      console.error("Failed to submit rating:", err);
      setMessage(err.message || "Error submitting rating. Try again.");
    
    }
  };

  return (
    <div
      style={{ border: "1px solid #ccc", borderRadius: 8, padding: "1rem", marginBottom: "1rem", boxShadow: "0 2px 5px rgba(0,0,0,0.08)" }}
      className="store"
    >
      <h3 style={{ margin: "0 0 0.25rem" }}>{store.name}</h3>
      <p style={{ margin: "0 0 0.25rem" }}><strong>Address:</strong> {store.address || "—"}</p>
      <p style={{ margin: 0 }}>
        <strong>Overall Rating:</strong>{" "}
        {store.average_rating != null ? Number(store.average_rating).toFixed(1) : "No rating yet"}{" "}
        <small>({store.ratings_count || 0})</small>
      </p>

      <div style={{ marginTop: 10 }}>
        <p style={{ margin: "0 0 6px" }}><strong>Your Rating:</strong></p>
        <RatingStars initialRating={userRating} onRate={handleRate} />
      </div>

      {message && (
        <p style={{ color: message.includes("Error") ? "red" : "green", marginTop: 8 }}>
          {message}
        </p>
      )}
    </div>
  );
}
