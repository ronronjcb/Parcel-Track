import { api } from "../api.js";

// Accounts (coordinator lang). Walang password hash na ibinabalik ng backend.
export async function listUsers() {
  return (await api("/users")).users;
}

// POST /api/users  (role: seller | rider | coordinator)
export async function createUser({ name, email, password, role }) {
  return (await api("/users", { method: "POST", body: { name, email, password, role } })).user;
}
