export const API_URL = "http://localhost:3000";

export async function postJSON(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    const err = new Error(data?.error || "Request failed");
    err.details = data;
    throw err;
  }
  return data;
}

export function saveToken(token) {
  localStorage.setItem("auth_token", token);
}

export function getToken() {
  return localStorage.getItem("auth_token");
}

export function clearToken() {
  localStorage.removeItem("auth_token");
}
