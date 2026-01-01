import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, BarChart, Sparkles } from 'lucide-react';
import { groupReflectionsAPI, doublebotAPI } from '../../services/api';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function EnhancedStudentInterface() {
  const [stage, setStage] = useState('loading');
  const [projectTopic, setProjectTopic] = useState('');
  const [myTeam, setMyTeam] = useState(null);
  const [reflectionId, setReflectionId] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  
  const chatEndRef = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchMyTeam();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const fetchMyTeam = async () => {
    try {
      const res = await fetch(`${API_URL}/students/my-team`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.team) {
        setMyTeam(data.team);
        setProjectTopic(data.team.projectName);
        setStage('ready');
      } else {
        setError('אתה לא משויך לאף צוות. פנה למרצה.');
        setStage('error');
      }
    } catch (error) {
      console.error('Fetch team error:', error);
      setError('שגיאה בטעינת הצוות שלך');
      setStage('error');
    }
  };

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const createRes = await groupReflectionsAPI.create({ 
        groupName: myTeam.teamId,
        projectTopic: myTeam.projectName,
        teamId: myTeam.teamId
      });
      const refId = createRes.reflection._id;
      setReflectionId(refId);

      const startRes = await doublebotAPI.start(refId);
      
      setConversation([{
        role: 'assistant',
        content: startRes.botMessage
      }]);
      
      setStage('conversation');
    } catch (error) {
      alert('שגיאה: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userMessage.trim()) return;

    const newMessage = { role: 'user', content: userMessage };
    setConversation([...conversation, newMessage]);
    setUserMessage('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/doublebot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reflectionId, userMessage })
      });

      const data = await res.json();
      
      setConversation([...conversation, newMessage, {
        role: 'assistant',
        content: data.botMessage
      }]);
    } catch (error) {
      alert('שגיאה: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getAnalysis = async () => {
    setIsLoading(true);
    try {
      const res = await doublebotAPI.analyze(reflectionId);
      
      setAnalysis(res.analysis);
      setStage('completed');
    } catch (error) {
      alert('שגיאה: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStage('ready');
    setReflectionId(null);
    setConversation([]);
    setUserMessage('');
    setAnalysis(null);
  };

  if (stage === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ direction: 'rtl' }}>
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ direction: 'rtl' }}>
        <div className="max-w-md bg-red-50 border-2 border-red-500 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">שגיאה</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600 text-sm">פנה למרצה כדי להוסיף אותך לצוות</p>
        </div>
      </div>
    );
  }

  if (stage === 'ready') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ direction: 'rtl' }}>
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent mb-4">
              רפלקציה קבוצתית AI
            </h1>
            <p className="text-gray-600">
              שוחחו עם בוט הערכה וקבלו המלצות לשיפור
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-purple-300 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-xl mb-3 text-purple-800">הצוות שלך:</h3>
            <div className="space-y-2">
              <p className="text-lg"><strong className="text-purple-700">Team ID:</strong> {myTeam.teamId}</p>
              <p className="text-lg"><strong className="text-purple-700">פרויקט:</strong> {myTeam.projectName}</p>
              <div>
                <strong className="text-purple-700">חברי הצוות:</strong>
                <ul className="list-disc list-inside mt-2 mr-4">
                  {myTeam.members.map((member, idx) => (
                    <li key={idx} className="text-gray-700">
                      {member.name} {member.role === 'leader' && '👑'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={startConversation}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {isLoading ? 'מתחיל...' : 'התחל רפלקציה קבוצתית'}
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'completed') {
    return (
      <div className="min-h-screen p-8" style={{ direction: 'rtl' }}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 text-green-600" />
              <h2 className="text-3xl font-bold">ניתוח והמלצות</h2>
            </div>

            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>צוות:</strong> {myTeam.teamId} | <strong>פרויקט:</strong> {myTeam.projectName}
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-xl mb-4">💡 המלצות לקבוצה</h3>
              <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">{analysis}</p>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-xl mb-3">📋 מה עכשיו?</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>דונו בהמלצות כקבוצה במפגש הבא</li>
                <li>בחרו המלצה אחת ליישום מיידי</li>
                <li>עקבו אחרי השיפור ברפלקציה הבאה</li>
                <li>שתפו את המרצה בהתקדמות</li>
              </ul>
            </div>

            <button
              onClick={reset}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg"
            >
              התחל רפלקציה חדשה
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ direction: 'rtl' }}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">{myTeam.teamId}</h2>
            <p className="text-gray-600">{projectTopic}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4 h-96 overflow-y-auto">
            {conversation.map((msg, i) => (
              <div key={i} className={`mb-4 ${msg.role === 'user' ? 'text-left' : 'text-right'}`}>
                <div className={`inline-block max-w-[80%] p-4 rounded-xl ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-purple-100 text-gray-800'
                }`}>
                  <p className="text-sm mb-1 opacity-70">
                    {msg.role === 'user' ? '👥 אתם' : '🤖 בוט הערכה'}
                  </p>
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-center">
                <div className="inline-block px-4 py-2 bg-gray-200 rounded-lg">מקליד...</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="הקלידו את תגובתכם..."
              className="flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !userMessage.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={getAnalysis}
            disabled={isLoading || conversation.length < 4}
            className="w-full bg-gradient-to-r from-green-600 to-teal-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <BarChart className="w-5 h-5" />
            קבל המלצות (לפחות 4 הודעות)
          </button>
        </div>
      </div>
    </div>
  );
}

export default EnhancedStudentInterface;

