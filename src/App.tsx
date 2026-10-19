import { BrowserRouter as Router, Routes, Route } from "react-router";
import HomePage from "./pages/Home/HomePage";
import MapPage from "./pages/Map/MapPage";
import SessionPage from "./pages/Session/SessionPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/peta" element={<MapPage />} />
        <Route path="/sesi/:id" element={<SessionPage />} />
      </Routes>
    </Router>
  );
}
