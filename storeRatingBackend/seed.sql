-- Insert users
INSERT INTO users (name, email, password, address, role) VALUES
  ('Admin', 'admin@example.com', '$2a$10$pa.2Yya8RSzdy7gY5IWVk.5ggA8N3nj47NLEEP9XZkC01beY6J21S', '1 Admin Way', 'admin'), 
  ('Bob Owner',  'bob.owner@example.com',  'hashedpassword2', '42 Store Lane', 'owner'),
  ('Carol User', 'carol.user@example.com', 'hashedpassword3', '77 Shopper St', 'user')
ON CONFLICT DO NOTHING;
-- Admin@123
-- Insert stores (owned by Bob Owner, whose id is 2 assuming auto-increment starts at 1)
INSERT INTO stores (name, email, address, owner_id) VALUES
  ('Sunrise Grocery', 'contact@sunrisegrocery.com', '12 Market St', 2),
  ('Byte Cafe', 'hello@bytecafe.com', '42 Tech Ave', 2),
  ('Pages & Pens', 'info@pagespens.com', '7 Maple Rd', 2)
ON CONFLICT DO NOTHING;

-- Insert ratings (Carol User -> store 1, etc.)
-- Adjust user/store IDs if they differ after running inserts
INSERT INTO ratings (user_id, store_id, rating) VALUES
  (3, 1, 5),
  (3, 2, 4),
  (3, 3, 5)
ON CONFLICT DO NOTHING;