import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import {
  AdminPublicRoute,
  AdminRoute,
  ProtectedRoute,
  PublicRoute,
} from "@/auth/Guards";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import DoorControl from "./pages/DoorControl";
import Login from "./pages/Login";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<ProtectedRoute><DoorControl /></ProtectedRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/login" element={<AdminPublicRoute><AdminLogin /></AdminPublicRoute>} />
      </Routes>
    </AuthProvider>
  );
}