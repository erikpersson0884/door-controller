import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";

export default function useDoors(): Door[] {
  const [doors, setDoors] = useState<Door[]>([]);
  const { setAuthed } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/doors");
      if (res.status === 401) {
        setAuthed(false); // session expired, guards redirect to /login
        return;
      }
      const data: Door[] = await res.json();
      if (!cancelled) setDoors(data);
    }

    load().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setAuthed]);

  return doors;
}
