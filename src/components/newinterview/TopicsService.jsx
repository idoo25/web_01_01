import { useState, useEffect } from "react";
import { db, push, ref, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import AIQuestionGenerator from "./AIQuestionGenerator";
import CustomQuestionInput from "./CustomQuestionInput";
import DownloadService from "./DownloadService";

const TopicsService = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [intervieweeDetails, setIntervieweeDetails] = useState({
    name: "",
    date: "",
  });
  const [topicInput, setTopicInput] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [customQuestions, setCustomQuestions] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleIntervieweeChange = (e) => {
    setIntervieweeDetails({
      ...intervieweeDetails,
      [e.target.name]: e.target.value,
    });
  };

  const handleQuestionSelect = (question) => {
    setSelectedQuestions((prevSelected) =>
      prevSelected.includes(question)
        ? prevSelected.filter((q) => q !== question)
        : [...prevSelected, question]
    );
  };

  const handleAnswerChange = (question, answer) => {
    setAnswers({
      ...answers,
      [question]: answer,
    });
  };

  const handleSubmit = async () => {
    const interviewData = {
      intervieweeName: intervieweeDetails.name,
      date: intervieweeDetails.date,
      topic: topicInput,
      questionsAndAnswers: [],
      userId: currentUser ? currentUser.uid : null,
      username: currentUser ? currentUser.displayName : "Anonymous",
    };

    selectedQuestions.forEach((question) => {
      const answer = answers[question] || "";
      interviewData.questionsAndAnswers.push({ question, answer });
    });

    customQuestions.forEach((question) => {
      const answer = answers[question] || "";
      interviewData.questionsAndAnswers.push({ question, answer });
    });

    try {
      const interviewsRef = ref(db, "interviews");
      await push(interviewsRef, interviewData);
      alert("Interview saved!");
    } catch (error) {
      console.error("Error saving interview:", error);
      alert("Failed to save interview");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl sm:text-4xl font-bold text-purple-800 mb-8">Generate Interview Questions</h2>

      <div className="space-y-6 sm:space-y-8 mb-8">
        <input
          type="text"
          placeholder="Interviewee Name"
          name="name"
          className="w-full p-4 sm:p-5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white/70 text-xl sm:text-2xl"
          value={intervieweeDetails.name}
          onChange={handleIntervieweeChange}
        />
        <input
          type="date"
          name="date"
          className="w-full p-4 sm:p-5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white/70 text-xl sm:text-2xl"
          value={intervieweeDetails.date}
          onChange={handleIntervieweeChange}
        />
      </div>

      <div className="mb-8">
        <input
          type="text"
          placeholder="Enter a topic for interview questions"
          className="w-full p-4 sm:p-5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white/70 text-xl sm:text-2xl"
          value={topicInput}
          onChange={(e) => setTopicInput(e.target.value)}
        />
      </div>

      <AIQuestionGenerator
        topicInput={topicInput}
        setGeneratedQuestions={setGeneratedQuestions}
        setIsLoading={setIsLoading}
      />

      <CustomQuestionInput setCustomQuestions={setCustomQuestions} />

      {isLoading && <p className="text-xl text-center">Loading questions...</p>}

      {generatedQuestions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl sm:text-3xl font-semibold text-purple-800 mb-6">Generated Questions</h3>
          <div className="space-y-6">
            {generatedQuestions.map((question, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(question)}
                    onChange={() => handleQuestionSelect(question)}
                    className="w-6 h-6 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-xl sm:text-2xl">{question}</span>
                </div>

                {selectedQuestions.includes(question) && (
                  <div className="w-full mt-4">
                    <label className="block text-xl sm:text-2xl text-purple-800 mb-2">Enter your answer:</label>
                    <input
                      type="text"
                      placeholder="Enter your answer"
                      className="w-full p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white/70 text-xl sm:text-2xl"
                      value={answers[question] || ""}
                      onChange={(e) => handleAnswerChange(question, e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {customQuestions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl sm:text-3xl font-semibold text-purple-800 mb-6">Custom Questions</h3>
          <div className="space-y-6">
            {customQuestions.map((question, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(question)}
                    onChange={() => handleQuestionSelect(question)}
                    className="w-6 h-6 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-xl sm:text-2xl">{question}</span>
                </div>

                {selectedQuestions.includes(question) && (
                  <div className="w-full mt-4">
                    <label className="block text-xl sm:text-2xl text-purple-800 mb-2">Enter your answer:</label>
                    <input
                      type="text"
                      placeholder="Enter your answer"
                      className="w-full p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white/70 text-xl sm:text-2xl"
                      value={answers[question] || ""}
                      onChange={(e) => handleAnswerChange(question, e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(selectedQuestions.length > 0 || customQuestions.length > 0) && (
        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xl sm:text-2xl"
          >
            Save Interview
          </button>
          <DownloadService 
            interviewData={{
              intervieweeName: intervieweeDetails.name,
              date: intervieweeDetails.date,
              topic: topicInput
            }}
            customQuestions={customQuestions}
            selectedQuestions={selectedQuestions}
            answers={answers}
          />
        </div>
      )}
    </div>
  );
};

export default TopicsService;