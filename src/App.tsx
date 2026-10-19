import { BrowserRouter as Router, Routes, Route } from "react-router";
import PageTitle from "./components/PageTitle";
import HomePage from "./pages/Home/HomePage";

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route
            path="/home"
            element={
              <>
                <PageTitle title="PT CBL" />

                <HomePage />
              </>
            }
          />
        </Routes>
      </Router>
    </>
  );
}
