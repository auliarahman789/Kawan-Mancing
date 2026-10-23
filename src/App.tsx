import { BrowserRouter as Router, Routes, Route } from "react-router";
import RequireAuth from "./components/RequireAuth";
import AuthPage from "./pages/Auth/AuthPage";
import FeedPage from "./pages/Feed/FeedPage";
import SpotPage from "./pages/Spot/SpotPage";
import UserPage from "./pages/User/UserPage";
import NotifPage from "./pages/Notif/NotifPage";
import PostPage from "./pages/Post/PostPage";
import AdminPage from "./pages/Admin/AdminPage";
import HomePage from "./pages/Home/HomePage";
import MapPage from "./pages/Map/MapPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import SessionPage from "./pages/Session/SessionPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/masuk" element={<AuthPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/notifikasi" element={<NotifPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/peta" element={<MapPage />} />
          <Route path="/spot/:id" element={<SpotPage />} />
          <Route path="/pemancing/:id" element={<UserPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/sesi/:id" element={<SessionPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
