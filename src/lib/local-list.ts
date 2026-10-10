import { useCallback, useEffect, useState } from "react";

// Device-only list (cart / wishlist) until the owner's backend is connected.
export function useLocalList(key: string) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setIds(JSON.parse(localStorage.getItem(key) || "[]")); } catch { setIds([]); }
    setReady(true);
    const onSync = () => {
      try { setIds(JSON.parse(localStorage.getItem(key) || "[]")); } catch { /* ignore */ }
    };
    window.addEventListener("nexa-list", onSync);
    return () => window.removeEventListener("nexa-list", onSync);
  }, [key]);

  const write = useCallback((next: string[]) => {
    localStorage.setItem(key, JSON.stringify(next));
    setIds(next);
    window.dispatchEvent(new Event("nexa-list"));
  }, [key]);

  const toggle = (id: string) => write(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  const remove = (id: string) => write(ids.filter((x) => x !== id));
  return { ids, ready, toggle, remove, has: (id: string) => ids.includes(id) };
}
