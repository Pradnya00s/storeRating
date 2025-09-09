const API_URL = "http://localhost:3000";

async function request(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("auth_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed: ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
};

export default api;

