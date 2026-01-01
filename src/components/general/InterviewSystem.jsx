import { useState, useEffect } from "react";
import DoubleBotSystem from "../groupreflection/DoubleBotSystem";
import EnhancedInstructorDashboard from "./EnhancedInstructorDashboard";

function InterviewSystem({ onLogout }) {
  const [userRole, setUserRole] = useState("student");

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role || "student");
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  if (userRole === "instructor" || userRole === "admin") {
    return <EnhancedInstructorDashboard onLogout={onLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="p-4 bg-white shadow-sm flex justify-between items-center" style={{ direction: 'rtl' }}>
        <h1 className="text-2xl font-bold text-gray-800">מערכת רפלקציה קבוצתית</h1>
        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          התנתק
        </button>
      </div>
      <DoubleBotSystem />
    </div>
  );
}

export default InterviewSystem;
