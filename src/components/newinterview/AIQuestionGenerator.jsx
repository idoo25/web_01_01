import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const AIQuestionGenerator = ({ topicInput, setGeneratedQuestions, setIsLoading }) => {
  const [error, setError] = useState("");

  const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google AI API key is missing. Please check your .env file.');
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
  });

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };

  const generateQuestions = async () => {
    if (!topicInput) {
      alert("Please enter a topic to generate questions!");
      return;
    }
    setIsLoading(true);
    try {
      const chatSession = model.startChat({
        generationConfig,
        history: [],
      });

      const result = await chatSession.sendMessage(
        `Generate 10 newspaper interview questions based on the topic: ${topicInput}, don't write any word other than the questions`
      );

      const responseText = result.response.text();
      const questions = responseText.split("\n").map((item) => item.trim()).filter((item) => item);
      setGeneratedQuestions(questions);
    } catch (error) {
      setError("Error generating questions. Please try again.");
      console.error("Error generating questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={generateQuestions}
        className="w-70% mt-6 px-6 py-3 bg-purple-600 text-white rounded-md duration-200 text-xl"
      >
        Generate Questions
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default AIQuestionGenerator;
