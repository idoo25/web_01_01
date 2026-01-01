import { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Import Firebase modules
import { ref, query, orderByChild, equalTo, get } from "firebase/database"; // Realtime Database query functions

const InterviewHistory = ({ selectedInterview, setSelectedInterview, handleGetSummary, summary }) => {
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchInterviews(user.uid); // Fetch interviews when the user is authenticated
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch interviews filtered by current user
  const fetchInterviews = async (userId) => {
    const interviewsRef = ref(db, "interviews"); // Reference to the interviews node in Realtime Database
    const q = query(interviewsRef, orderByChild("userId"), equalTo(userId)); // Query for interviews where userId matches the current user's ID

    try {
      const snapshot = await get(q);
      if (snapshot.exists()) {
        const interviewsData = [];
        snapshot.forEach((childSnapshot) => {
          const interviewData = childSnapshot.val();
          console.log("Matching Interview:", interviewData); // Log the matching interview data
          interviewsData.push({
            id: childSnapshot.key,
            date: interviewData.date,
            intervieweeName: interviewData.intervieweeName,
            topic: interviewData.topic,
          });
        });
        setInterviews(interviewsData); // Set the filtered interviews in state
      } else {
        console.log("No matching interviews found for the current user.");
        setInterviews([]); // If no interviews exist for the user, set an empty array
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
    }
  };

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-purple-800 mb-6">Interview History</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-purple-100">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-purple-900">Date</th>
              <th className="px-4 py-2 text-left font-medium text-purple-900">Interviewee</th>
              <th className="px-4 py-2 text-left font-medium text-purple-900">Topic</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-200 bg-white/70">
            {interviews.map((interview) => (
              <tr
                key={interview.id}
                className="hover:bg-purple-50 cursor-pointer transition-colors"
                onClick={() => setSelectedInterview(interview)}
              >
                <td className="px-4 py-2">{interview.date}</td>
                <td className="px-4 py-2">{interview.intervieweeName}</td>
                <td className="px-4 py-2 capitalize">{interview.topic}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedInterview && (
        <div className="mt-6 space-y-4 bg-white/70 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-purple-800">Interview Details</h3>
          <div className="space-y-4">
            {selectedInterview.questionsAndAnswers.map((qa, index) => (
              <div key={index} className="space-y-1">
                <p className="font-medium text-purple-900">{qa.question}</p>
                <p className="text-gray-700 bg-white/50 p-2 rounded">
                  {qa.answer}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={handleGetSummary}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Get Summary
          </button>
          {summary && (
            <div className="p-4 bg-white/90 rounded border border-purple-200">
              {summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterviewHistory;
