export async function me() {
  const token = localStorage.getItem("token")
  const res = await fetch(`/api/me`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      Accept: "application/json",
    },
  })
  if (!res.ok) throw new Error("unauthenticated")
  return (await res.json()) as {
    user_id: string; user_name: string; email: string;
    role: "family" | "staff"; is_active: boolean;
  }
}
