import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/auth/Guards";
import DoorControl from "./pages/DoorControl";
import Login from "./pages/Login";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<ProtectedRoute><DoorControl /></ProtectedRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      </Routes>
    </AuthProvider>
  );
}