"use client";

import { useEffect, useState } from "react";

export default function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });
        const data = await res.json();

        if (!cancelled) {
          setIsAdmin(!!data?.isAdmin);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isAdmin, loading };
}