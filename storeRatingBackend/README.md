# Express Store Ratings API

* **Sign up** (POST `/auth/signup`)
* **Sign in** (POST `/auth/signin`) → returns a JWT
* **List stores** (GET `/stores`)
* **Get a store** (GET `/stores/:id`) including average rating and recent reviews
* **Rate a store** (POST `/stores/:id/ratings`) – requires auth

---

## 1) Setup

```bash
# 1) Create a new directory and enter it
mkdir store-ratings-api && cd store-ratings-api

# (Important) For dev
npm install

# 2) Start Postgres (pick one)
#    a) Download Docker Desktop
#    b) Docker Compose (see docker-compose.yml below):
docker compose up -d

# 5) Create DB objects
# Please make sure No other postgres server is running than docker
#    Update .env first with DATABASE_URL (examples below), then run:
npm run db:schema
npm run db:seed

# 6) Run the API
npm run dev
# or
npm start
```

---

## 2) Quick Test with cURL

```bash
# Sign up
curl -s -X POST http://localhost:3000/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","password":"hunter2"}' | jq

# Sign in → get token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"hunter2"}' | jq -r .token)

# List stores
curl -s http://localhost:3000/stores | jq

# Get one store (replace with actual UUID from /stores)
STORE_ID=$(curl -s http://localhost:3000/stores | jq -r .stores[0].id)
curl -s http://localhost:3000/stores/$STORE_ID | jq

# Rate a store (create or update your rating)
curl -s -X POST http://localhost:3000/stores/$STORE_ID/ratings \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"rating":5, "comment":"Great cappuccino!"}' | jq
```
