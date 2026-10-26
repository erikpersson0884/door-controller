import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import useDoors from "@/hooks/useDoors";

const BTN_CLASSES = ["btn-open", "btn-close"]; // cycles through the two color styles
const RESET_DELAY_MS = 4000;

export default function DoorControl() {
  const { doors, unauthorized } = useDoors();

  const [busy, setBusy] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null); // door whose button shows a result
  const [activeLabel, setActiveLabel] = useState("");
  const [activeState, setActiveState] = useState(""); // "", "success" or "error"
  const [status, setStatus] = useState("");

  const resetTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  if (unauthorized) return <Navigate to="/login" replace />;

  const doorList = doors as Door[];

  async function openDoor(door: Door) {
    setBusy(true);
    setActiveId(door.id);
    setActiveLabel("Opening...");
    setActiveState("");
    setStatus("Sending request...");

    try {
      const r = await fetch(`/trigger/${door.id}`, { method: "POST" });
      const data = await r.json();

      if (data.ok) {
        setActiveLabel("✅ Opened!");
        setActiveState("success");
        setStatus("Door opened successfully");
      } else {
        setActiveLabel("❌ Failed");
        setActiveState("error");
        setStatus(JSON.stringify(data));
      }
    } catch (e: any) {
      setActiveLabel("❌ Error");
      setActiveState("error");
      setStatus(e.message);
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
        {doorList.map((door, index) => {
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
