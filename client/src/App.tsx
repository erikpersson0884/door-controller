import { Routes, Route } from "react-router-dom";
import DoorControl from "@/pages/DoorControl.jsx";
import Login from "@/pages/Login.jsx";
import "./styles.css";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<DoorControl />} />
            <Route path="/login" element={<Login />} />
        </Routes>
    );
}
