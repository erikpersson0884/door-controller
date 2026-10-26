import { useEffect, useRef, useState } from "react";
import useDoors from "../hooks/useDoors";

const BTN_CLASSES = ["btn-open", "btn-close"] as const;
const RESET_DELAY_MS = 4000;

type ResultState = "" | "success" | "error";

export default function DoorControl() {
  const doors = useDoors();

  const [busy, setBusy] = useState(false);
  const [activeId, setActiveId] = useState<Door["id"] | null>(null);
  const [activeLabel, setActiveLabel] = useState("");
  const [activeState, setActiveState] = useState<ResultState>("");
  const [status, setStatus] = useState("");

  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function openDoor(door: Door) {
    setBusy(true);
    setActiveId(door.id);
    setActiveLabel("Opening...");
    setActiveState("");
    setStatus("Sending request...");

    try {
      const r = await fetch(`/trigger/${door.id}`, { method: "POST" });
      const data: TriggerResponse = await r.json();

      if (data.ok) {
        setActiveLabel("✅ Opened!");
        setActiveState("success");
        setStatus("Door opened successfully");
      } else {
        setActiveLabel("❌ Failed");
        setActiveState("error");
        setStatus(JSON.stringify(data));
      }
    } catch (e) {
      setActiveLabel("❌ Error");
      setActiveState("error");
      setStatus(e instanceof Error ? e.message : String(e));
    }

    resetTimer.current = setTimeout(() => {
      setBusy(false);
      setActiveId(null);
      setActiveLabel("");
      setActiveState("");
      setStatus("");
    }, RESET_DELAY_MS);
  }

  return (
    <div className="container">
      <h1>Door Control</h1>
      <div id="buttons">
        {doors.map((door, index) => {
          const isActive = door.id === activeId;
          const classes = [BTN_CLASSES[index % BTN_CLASSES.length], isActive ? activeState : ""]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={door.id}
              className={classes}
              disabled={busy}
              onClick={() => openDoor(door)}
            >
              {isActive ? activeLabel : `Open ${door.name}`}
            </button>
          );
        })}
      </div>
      <div id="status">{status}</div>
    </div>
  );
}
