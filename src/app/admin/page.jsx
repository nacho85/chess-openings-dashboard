"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setMsg(data.error || "No se pudo ingresar");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setMsg(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm border rounded-xl p-6 flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Modo admin</h1>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Clave admin"
          className="border rounded px-3 py-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="border rounded px-3 py-2 font-semibold"
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>

        {msg ? <div className="text-sm text-red-600">{msg}</div> : null}
      </form>
    </main>
  );
}