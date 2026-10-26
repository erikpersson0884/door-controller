import { useEffect, useState } from "react";

// Fetches the list of doors once on mount.
// Returns { doors, unauthorized } — unauthorized is true if the server answers 401.
export default function useDoors() {
    const [doors, setDoors] = useState([]);
    const [unauthorized, setUnauthorized] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
        const res = await fetch("/doors");
            if (res.status === 401) {
                if (!cancelled) setUnauthorized(true);
                return;
            }
            const data = await res.json();
            if (!cancelled) setDoors(data);
        }

        load().catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    return { doors, unauthorized };
}
