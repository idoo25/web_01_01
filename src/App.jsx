import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import "./App.css";
import "./index.css";
import LoginPage from "./components/connection/LoginPage.jsx";
import SignUp from "./components/connection/SignUp.jsx";
import Interviewsystem from "./components/general/InterviewSystem.jsx";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track login status

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<LoginPage onLogin={() => setIsLoggedIn(true)} />}
        />
        <Route path="/signup" element={<SignUp />} />

        {/* Main route to render Interviewsystem if logged in */}
        <Route
          path="/main"
          element={isLoggedIn ? <Interviewsystem /> : <Navigate to="/" />}
        />

        {/* InterviewSystem route if logged in */}
        <Route
          path="/interviewsystem"
          element={isLoggedIn ? <Interviewsystem /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
