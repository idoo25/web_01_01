import { useState, useEffect } from 'react';
import { Users, MessageSquare, Eye } from 'lucide-react';
import { instructorAPI } from '../../services/api';

function InstructorDashboard({ onLogout }) {
  const [stats, setStats] = useState({ totalStudents: 0, totalReflections: 0 });
  const [reflections, setReflections] = useState([]);
  const [selectedReflection, setSelectedReflection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const studentsRes = await instructorAPI.getStudents();
      const reflectionsRes = await instructorAPI.getReflections();
      
      setReflections(reflectionsRes.reflections || []);
      setStats({
        totalStudents: studentsRes.students?.length || 0,
        totalReflections: reflectionsRes.reflections?.length || 0
      });

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">טוען...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8" style={{ direction: 'rtl' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">דשבורד מרצה</h1>
            <p className="text-gray-600">ניהול רפלקציות קבוצתיות</p>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
          >
            התנתק
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">סטודנטים</p>
                <p className="text-3xl font-bold">{stats.totalStudents}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">רפלקציות</p>
                <p className="text-3xl font-bold">{stats.totalReflections}</p>
              </div>
              <MessageSquare className="w-12 h-12 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">כל הרפלקציות</h2>
          {reflections.length === 0 ? (
            <p className="text-center py-8 text-gray-600">אין רפלקציות</p>
          ) : (
            <div className="space-y-4">
              {reflections.map((ref) => (
                <div key={ref._id} className="border rounded-lg p-6 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-xl mb-2">{ref.groupName}</h3>
                      <p className="text-gray-600 mb-2">נושא: {ref.projectTopic}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(ref.createdAt).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      ref.stage === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {ref.stage === 'completed' ? 'הושלם' : 'בתהליך'}
                    </span>
                  </div>

                  {ref.scores && (
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">איכות שיחה</p>
                        <p className="text-2xl font-bold text-blue-600">{ref.scores.conversationQuality}/10</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">חשיבה ביקורתית</p>
                        <p className="text-2xl font-bold text-purple-600">{ref.scores.criticalThinking}/10</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">דינמיקה קבוצתית</p>
                        <p className="text-2xl font-bold text-green-600">{ref.scores.teamDynamics}/10</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      שיחה: {ref.conversationHistory?.length || 0} הודעות
                    </p>
                    <button
                      onClick={() => setSelectedReflection(selectedReflection?._id === ref._id ? null : ref)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {selectedReflection?._id === ref._id ? 'הסתר' : 'צפה בשיחה'}
                    </button>
                  </div>

                  {selectedReflection?._id === ref._id && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <h4 className="font-bold mb-3">היסטוריית השיחה:</h4>
                      {ref.conversationHistory?.map((msg, i) => (
                        <div key={i} className={`mb-3 p-3 rounded-lg ${
                          msg.role === 'bot1' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                          <p className="text-xs text-gray-600 mb-1">
                            {msg.role === 'bot1' ? '🤖 בוט הערכה' : '✨ בוט חשיבה ביקורתית'}
                          </p>
                          <p className="text-gray-800">{msg.content}</p>
                        </div>
                      ))}
                      {ref.finalAnalysis && (
                        <div className="mt-4 bg-yellow-50 rounded-lg p-4">
                          <h4 className="font-bold mb-2">ניתוח סופי:</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">{ref.finalAnalysis}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InstructorDashboard;
