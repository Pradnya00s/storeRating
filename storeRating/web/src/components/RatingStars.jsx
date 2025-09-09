import { useEffect, useState } from "react";

export default function RatingStars({ initialRating = 0, onRate }) {
  const [rating, setRating] = useState(initialRating);

  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  const handleClick = (value) => {
    setRating(value);
    onRate?.(value);
  };

  return (
    <div style={{ display: "flex", gap: "0.2rem", cursor: "pointer" }} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => handleClick(star)}
          style={{ color: star <= rating ? "gold" : "lightgray", fontSize: "1.5rem" }}
          role="img"
          aria-label={star <= rating ? "star filled" : "star empty"}
        >
          ★
        </span>
      ))}
    </div>
  );
}
