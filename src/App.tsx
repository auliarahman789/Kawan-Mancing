import { BrowserRouter as Router, Routes, Route } from "react-router";
import RequireAuth from "./components/RequireAuth";
import AuthPage from "./pages/Auth/AuthPage";
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
          <Route path="/peta" element={<MapPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/sesi/:id" element={<SessionPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
