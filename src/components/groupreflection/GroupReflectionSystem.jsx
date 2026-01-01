import { useState, useRef, useEffect } from 'react';
import { Brain, Users, Send, Sparkles } from 'lucide-react';
import { groupReflectionsAPI } from '../../services/api';
import { callClaude } from './ConversationService';

function GroupReflectionSystem() {
  const [currentStage, setCurrentStage] = useState('initial');
  const [assessmentMessages, setAssessmentMessages] = useState([]);
  const [reflectionMessages, setReflectionMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentReflectionId, setCurrentReflectionId] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [projectTopic, setProjectTopic] = useState('');

  const assessmentEndRef = useRef(null);
  const reflectionEndRef = useRef(null);

  useEffect(() => {
    if (assessmentEndRef.current) {
      assessmentEndRef.current.scrollTop = assessmentEndRef.current.scrollHeight;
    }
  }, [assessmentMessages]);

  useEffect(() => {
    if (reflectionEndRef.current) {
      reflectionEndRef.current.scrollTop = reflectionEndRef.current.scrollHeight;
    }
  }, [reflectionMessages]);

  const assessmentSystemPrompt = `אתה בוט הערכה קבוצתית המסייע לסטודנטים להעריך את עבודתם הקבוצתית בפרויקט IoT. תפקידך:
1. לשאול שאלות מעמיקות על התקדמות הפרויקט
2. לחקור אתגרים ושיתוף פעולה בקבוצה
3. לעודד דיון פתוח וכן
4. לדבר בעברית בלבד
5. לשאול שאלה אחת בכל פעם
6. להיות אמפטי ותומך

התחל בשאלה פתיחה על הפרויקט שלהם.`;

  const reflectionSystemPrompt = `אתה בוט רפלקציה המספק תובנות למרצה על סמך שיחת הערכה קבוצתית. נתח את השיחה והצע:
1. נקודות חוזק בעבודת הקבוצה
2. אתגרים שזוהו
3. המלצות לשיפור
4. תרגילים או התערבויות אפשריות
5. דבר בעברית בלבד
6. היה מקצועי וממוקד

ספק ניתוח מעמיק ומועיל.`;

  const startAssessment = async () => {
    if (!groupName.trim() || !projectTopic.trim()) {
      alert('נא למלא את שם הקבוצה ונושא הפרויקט');
      return;
    }

    setIsLoading(true);
    try {
      // Create new reflection in MongoDB
      const response = await groupReflectionsAPI.create({
        groupName: groupName,
        projectTopic: projectTopic,
        stage: 'assessment'
      });

      setCurrentReflectionId(response.reflection._id);

      // Get first message from Claude
      const firstMessage = await callClaude(assessmentSystemPrompt, []);
      
      const botMessage = {
        role: 'assistant',
        content: firstMessage
      };

      setAssessmentMessages([botMessage]);
      
      // Save to MongoDB
      await groupReflectionsAPI.addMessage(response.reflection._id, 'assessment', botMessage);
      
      setCurrentStage('assessment');
    } catch (error) {
      console.error('Error starting assessment:', error);
      alert('שגיאה בהתחלת השיחה: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendAssessmentMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: userInput
    };

    const newMessages = [...assessmentMessages, userMessage];
    setAssessmentMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      // Save user message to MongoDB
      await groupReflectionsAPI.addMessage(currentReflectionId, 'assessment', userMessage);

      // Get Claude response
      const response = await callClaude(assessmentSystemPrompt, newMessages);
      
      const botMessage = {
        role: 'assistant',
        content: response
      };

      setAssessmentMessages([...newMessages, botMessage]);
      
      // Save bot message to MongoDB
      await groupReflectionsAPI.addMessage(currentReflectionId, 'assessment', botMessage);
      
    } catch (error) {
      console.error('Error:', error);
      alert('שגיאה בשליחת ההודעה: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const requestReflection = async () => {
    setIsLoading(true);
    try {
      // Update stage to reflection
      await groupReflectionsAPI.update(currentReflectionId, {
        stage: 'reflection'
      });

      const conversationSummary = assessmentMessages
        .map(msg => `${msg.role === 'user' ? 'קבוצה' : 'בוט'}: ${msg.content}`)
        .join('\n\n');

      const reflectionPrompt = `להלן שיחת הערכה קבוצתית שהתקיימה:\n\n${conversationSummary}\n\nנא לספק ניתוח מקצועי ומעמיק.`;

      const reflectionResponse = await callClaude(reflectionSystemPrompt, [
        { role: 'user', content: reflectionPrompt }
      ]);

      const botMessage = {
        role: 'assistant',
        content: reflectionResponse
      };

      setReflectionMessages([botMessage]);
      
      // Save to MongoDB
      await groupReflectionsAPI.addMessage(currentReflectionId, 'reflection', botMessage);
      
      // Mark as completed
      await groupReflectionsAPI.complete(currentReflectionId);
      
      setCurrentStage('reflection');
    } catch (error) {
      console.error('Error getting reflection:', error);
      alert('שגיאה בקבלת רפלקציה: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSystem = () => {
    setCurrentStage('initial');
    setAssessmentMessages([]);
    setReflectionMessages([]);
    setUserInput('');
    setCurrentReflectionId(null);
    setGroupName('');
    setProjectTopic('');
  };

  if (currentStage === 'initial') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ direction: 'rtl' }}>
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Brain className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent mb-4">
              מערכת רפלקציה קבוצתית
            </h1>
            <p className="text-gray-600">
              שיחה מודרכת עם AI לניתוח עבודה קבוצתית ורפלקציה מקצועית
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-gray-700 font-medium mb-2">שם הקבוצה</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="לדוגמה: קבוצה 1"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">נושא הפרויקט</label>
              <input
                type="text"
                value={projectTopic}
                onChange={(e) => setProjectTopic(e.target.value)}
                placeholder="לדוגמה: מערכת IoT לחקלאות חכמה"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            onClick={startAssessment}
            disabled={isLoading || !groupName.trim() || !projectTopic.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              'מתחיל שיחה...'
            ) : (
              <>
                <Users className="w-6 h-6" />
                התחל שיחה
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ direction: 'rtl' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Assessment Bot */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-2xl p-6 flex flex-col h-[700px]">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-blue-800">בוט הערכה</h2>
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              <div>קבוצה: <span className="font-semibold">{groupName}</span></div>
              <div>נושא: <span className="font-semibold">{projectTopic}</span></div>
            </div>

            <div ref={assessmentEndRef} className="flex-1 overflow-y-auto mb-4 space-y-3">
              {assessmentMessages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white mr-12'
                      : 'bg-white text-gray-800 ml-12 shadow-md'
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {isLoading && currentStage === 'assessment' && (
                <div className="bg-white p-4 rounded-xl ml-12 shadow-md">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              )}
            </div>

            {currentStage === 'assessment' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendAssessmentMessage()}
                    placeholder="הקלד את תשובתך..."
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendAssessmentMessage}
                    disabled={isLoading || !userInput.trim()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={requestReflection}
                  disabled={isLoading || assessmentMessages.length < 4}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  קבל רפלקציה מקצועית
                </button>
              </div>
            )}
          </div>

          {/* Reflection Bot */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-2xl p-6 flex flex-col h-[700px]">
            <div className="flex items-center gap-3 mb-6">
              <Brain className="w-8 h-8 text-purple-600" />
              <h2 className="text-2xl font-bold text-purple-800">בוט רפלקציה</h2>
            </div>

            <div ref={reflectionEndRef} className="flex-1 overflow-y-auto">
              {currentStage === 'reflection' ? (
                <div className="space-y-4">
                  {reflectionMessages.map((message, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-md">
                      <div className="prose max-w-none text-gray-800 whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={resetSystem}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    התחל שיחה חדשה
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>הרפלקציה תופיע כאן לאחר השלמת השיחה</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupReflectionSystem;
