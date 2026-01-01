import { useState } from "react";

const CustomQuestionInput = ({ setCustomQuestions }) => {
  const [customQuestion, setCustomQuestion] = useState("");

  const handleAddCustomQuestion = () => {
    if (customQuestion.trim()) {
      setCustomQuestions((prevQuestions) => [...prevQuestions, customQuestion.trim()]);
      setCustomQuestion("");
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-2xl font-semibold text-purple-800 mb-6">Add Custom Questions</h3>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <input
          type="text"
          placeholder="Enter your custom question"
          className="flex-1 p-4 sm:p-5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white/70 text-lg sm:text-xl"
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleAddCustomQuestion();
            }
          }}
        />
        <button
          onClick={handleAddCustomQuestion}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg sm:text-xl"
        >
          Add Question
        </button>
      </div>
    </div>
  );
};

export default CustomQuestionInput; // This ensures it's exported as default
