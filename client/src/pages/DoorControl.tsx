import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useDoors from "../hooks/useDoors";

const BTN_CLASSES = ["btn-open", "btn-close"] as const;
const RESET_DELAY_MS = 4000;
const AUTO_UNLOCK_STORAGE_KEY = "door-control-auto-unlock";

type ResultState = "" | "success" | "error";

type DoorState = {
  label: string;
  state: ResultState;
};

export default function DoorControl() {
  const doors = useDoors();

  const [doorStates, setDoorStates] = useState<Record<string, DoorState>>({});
  const [status, setStatus] = useState("");
  const [lastOpened, setLastOpened] = useState<{ name: string; at: number } | null>(null);
  const [autoUnlockOnLoad, setAutoUnlockOnLoad] = useState(
    () => window.localStorage.getItem(AUTO_UNLOCK_STORAGE_KEY) === "true"
  );

  const resetTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const autoUnlockOnInitialLoad = useRef(autoUnlockOnLoad);
  const autoUnlockTriggered = useRef(false);

  useEffect(() => {
    return () => {
      Object.values(resetTimers.current).forEach(clearTimeout);
      clearTimeout(notificationTimer.current);
    };
  }, []);

  const showNotification = useCallback((message: string) => {
    clearTimeout(notificationTimer.current);
    setStatus(message);
    notificationTimer.current = setTimeout(() => {
      setStatus("");
    }, RESET_DELAY_MS);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      AUTO_UNLOCK_STORAGE_KEY,
      String(autoUnlockOnLoad)
    );
  }, [autoUnlockOnLoad]);

  const openDoor = useCallback(async (door: Door) => {
    setDoorStates((current) => ({
      ...current,
      [door.id]: { label: "Opening...", state: "" } satisfies DoorState,
    }));
    showNotification(`Opening ${door.name}...`);

    try {
      const response = await fetch(`/trigger/${door.id}`, { method: "POST" });
      const data: TriggerResponse = await response.json();
      const result: DoorState = data.ok
        ? { label: "✅ Opened!", state: "success" }
        : { label: "❌ Failed", state: "error" };

      setDoorStates((current) => ({
        ...current,
        [door.id]: result,
      }));
      if (data.ok) {
        setLastOpened({ name: door.name, at: Date.now() });
      }
      showNotification(
        data.ok
          ? `${door.name} opened successfully`
          : `${door.name} failed: ${JSON.stringify(data)}`
      );
    } catch (error) {
      setDoorStates((current) => ({
        ...current,
        [door.id]: { label: "❌ Error", state: "error" } satisfies DoorState,
      }));
      showNotification(error instanceof Error ? error.message : String(error));
    }

    clearTimeout(resetTimers.current[door.id]);
    resetTimers.current[door.id] = setTimeout(() => {
      setDoorStates((current) => {
        const next = { ...current };
        delete next[door.id];
        return next;
      });
    }, RESET_DELAY_MS);
  }, [showNotification]);

  useEffect(() => {
    if (
      !autoUnlockOnInitialLoad.current ||
      doors.length === 0 ||
      autoUnlockTriggered.current
    ) {
      return;
    }

    autoUnlockTriggered.current = true;
    doors.forEach((door) => {
      void openDoor(door);
    });
  }, [doors, openDoor]);

  return (
    <main className="app-page door-page">
      <div className="page-header">
        <h1>Door Control</h1>
        <Link className="admin-link" to="/admin/login">Admin</Link>
      </div>
      <p className="page-subtitle">Select a door below to open it.</p>

      <div id="buttons" className="door-list">
        {doors.map((door, index) => {
          const state = doorStates[door.id];
          const isBusy = state?.label === "Opening...";
          const classes = [
            BTN_CLASSES[index % BTN_CLASSES.length],
            state?.state ?? "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={door.id}
              className={classes}
              disabled={isBusy}
              onClick={() => openDoor(door)}
            >
              <span className={`door-icon door-icon-${index % 2}`} aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M5 10h14v10H5z" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  <path d="M12 14v3" />
                </svg>
              </span>
              <span className="door-button-copy">
                <strong>{door.name}</strong>
                <small>{state ? state.label : "Press to open"}</small>
              </span>
            </button>
          );
        })}
      </div>

      <label className="switch-label">
        <span>Auto-unlock on page load</span>
        <span className="switch">
          <input
            type="checkbox"
            checked={autoUnlockOnLoad}
            onChange={(event) => setAutoUnlockOnLoad(event.target.checked)}
          />
          <span className="slider" />
        </span>
      </label>

      <div className="last-opened">
        {lastOpened ? `Last opened: ${lastOpened.name}, just now` : "Last opened: —"}
      </div>

      {status && (
        <div className="toast" role="status" aria-live="polite">
          {status}
        </div>
      )}
    </main>
  );
}
