
const NewInterview = ({
  topics,
  intervieweeDetails,
  setIntervieweeDetails,
  selectedTopic,
  setSelectedTopic,
  selectedQuestions,
  handleQuestionSelect,
  answers,
  handleAnswerChange,
  handleCustomQuestionAdd,
  handleSaveInterview,
}) => {
  const handleTopicChange = (e) => {
    setSelectedTopic(e.target.value);
  };

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-purple-800 mb-6">New Interview</h2>
      <div className="space-y-6">
        <div className="grid gap-4">
          <input
            type="text"
            placeholder="Interviewee Name"
            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white/70"
            value={intervieweeDetails.name}
            onChange={(e) =>
              setIntervieweeDetails({ ...intervieweeDetails, name: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Background"
            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white/70"
            value={intervieweeDetails.background}
            onChange={(e) =>
              setIntervieweeDetails({ ...intervieweeDetails, background: e.target.value })
            }
          />
          <input
            type="date"
            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white/70"
            value={intervieweeDetails.date}
            onChange={(e) =>
              setIntervieweeDetails({ ...intervieweeDetails, date: e.target.value })
            }
          />
          <select
            value={selectedTopic}
            onChange={handleTopicChange}
            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white/70 capitalize"
          >
            <option value="">Select Interview Topic</option>
            {Object.keys(topics).map((topic) => (
              <option key={topic} value={topic} className="capitalize">
                {topic}
              </option>
            ))}
          </select>
        </div>

        {selectedTopic && (
          <div className="space-y-4 bg-white/70 p-4 rounded-lg">
            <h3 className="text-lg font-semibold capitalize text-purple-800">
              {selectedTopic} Questions
            </h3>
            {topics[selectedTopic].map((question) => (
              <div key={question} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(question)}
                    onChange={() => handleQuestionSelect(question)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span>{question}</span>
                </div>
                {selectedQuestions.includes(question) && (
                  <input
                    type="text"
                    placeholder="Enter answer"
                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white/90"
                    value={answers[question] || ''}
                    onChange={(e) => handleAnswerChange(question, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={handleCustomQuestionAdd}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Add Custom Question
          </button>
          <button
            onClick={handleSaveInterview}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Save Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewInterview;
