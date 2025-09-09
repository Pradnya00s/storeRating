import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Stores from "./pages/Stores";
import Home from "./components/Home";
import AdminDashboard from "./pages/AdminDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import UserProfile from "./pages/UserPofile";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/stores" element={<Stores />} />
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/profile" element={<UserProfile />} />
      </Routes>
    </>
  );
}
