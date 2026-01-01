import { useState, useEffect } from 'react';
import { Users, AlertTriangle, TrendingUp, Plus, Eye, Trash2, Edit, Bell, MessageSquare } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function EnhancedInstructorDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('teams');
  const [teams, setTeams] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [teamHistory, setTeamHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [newTeam, setNewTeam] = useState({
    teamId: '',
    projectName: '',
    members: [{ email: '', name: '', role: 'member' }]
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
    fetchAllStudents();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const teamsRes = await fetch(`${API_URL}/teams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const teamsData = await teamsRes.json();
      setTeams(teamsData.teams || []);

      const notifRes = await fetch(`${API_URL}/instructor/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => ({ json: () => ({ notifications: [] }) }));
      const notifData = await notifRes.json();
      setNotifications(notifData.notifications || []);

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await fetch(`${API_URL}/instructor/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAllStudents(data.students || []);
    } catch (error) {
      console.error('Fetch students error:', error);
    }
  };

  const fetchTeamAnalytics = async (teamId) => {
    try {
      const res = await fetch(`${API_URL}/teams/${teamId}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  const fetchTeamHistory = async (teamId) => {
    try {
      const res = await fetch(`${API_URL}/instructor/team-history/${teamId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTeamHistory(data.reflections || []);
    } catch (error) {
      console.error('History error:', error);
    }
  };

  const getNextTeamNumber = () => {
    if (teams.length === 0) return 'TEAM-001';

    const teamNumbers = teams
      .map(t => {
        const match = t.teamId.match(/TEAM-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0);

    const maxNumber = teamNumbers.length > 0 ? Math.max(...teamNumbers) : 0;
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
    return `TEAM-${nextNumber}`;
  };

  const handleStudentSelect = (index, email) => {
    const student = allStudents.find(s => s.email === email);
    if (student) {
      const updated = [...newTeam.members];
      updated[index] = {
        email: student.email,
        name: student.name,
        role: updated[index].role || 'member'
      };
      setNewTeam({ ...newTeam, members: updated });
    }
  };

  const createTeam = async () => {
    if (!newTeam.teamId || !newTeam.projectName) {
      alert('נא למלא Team ID ושם פרויקט');
      return;
    }

    const hasEmptyMembers = newTeam.members.some(m => !m.email);
    if (hasEmptyMembers) {
      alert('נא לבחור סטודנט לכל חבר צוות');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTeam)
      });

      const data = await res.json();

      if (res.ok) {
        alert('✅ צוות נוצר בהצלחה!');
        setShowCreateTeam(false);
        setNewTeam({ teamId: '', projectName: '', members: [{ email: '', name: '', role: 'member' }] });
        fetchData();
      } else {
        alert('❌ שגיאה: ' + (data.error || 'לא ניתן ליצור צוות'));
      }
    } catch (error) {
      alert('שגיאה בחיבור לשרת: ' + error.message);
    }
  };

  const updateTeam = async () => {
    try {
      const res = await fetch(`${API_URL}/teams/${editingTeam.teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectName: editingTeam.projectName,
          members: editingTeam.members
        })
      });

      if (res.ok) {
        alert('✅ צוות עודכן בהצלחה!');
        setEditingTeam(null);
        fetchData();
      } else {
        const data = await res.json();
        alert('❌ שגיאה: ' + (data.error || 'לא ניתן לעדכן צוות'));
      }
    } catch (error) {
      alert('שגיאה: ' + error.message);
    }
  };

  const deleteTeam = async (teamId) => {
    if (!confirm('למחוק צוות זה? הפעולה בלתי הפיכה!')) return;

    try {
      await fetch(`${API_URL}/teams/${teamId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
      alert('✅ צוות נמחק');
    } catch {
      alert('שגיאה במחיקת צוות');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'green': return '🟢';
      case 'yellow': return '🟡';
      case 'red': return '🔴';
      default: return '⚪';
    }
  };

  const statusDistribution = teams.reduce((acc, team) => {
    acc[team.status] = (acc[team.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = [
    { name: 'Green', value: statusDistribution.green || 0, color: '#10b981' },
    { name: 'Yellow', value: statusDistribution.yellow || 0, color: '#f59e0b' },
    { name: 'Red', value: statusDistribution.red || 0, color: '#ef4444' }
  ];

  // Auto-refresh team history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history' && selectedTeam) {
      fetchTeamHistory(selectedTeam.teamId);
    }
  }, [activeTab, selectedTeam]);

  if (loading) {

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ direction: 'rtl' }}>
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8" style={{ direction: 'rtl' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">דשבורד מרצה מתקדם</h1>
            <p className="text-gray-600">ניהול ומעקב אחר צוותי סטודנטים</p>
          </div>
          <div className="flex gap-4">
            <button className="relative bg-white p-3 rounded-lg shadow hover:shadow-lg transition">
              <Bell className="w-6 h-6 text-gray-700" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            <button
              onClick={onLogout}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
            >
              התנתק
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">סה&quot;כ צוותים</p>
                <p className="text-3xl font-bold">{teams.length}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">צוותים ירוקים</p>
                <p className="text-3xl font-bold text-green-600">{statusDistribution.green || 0}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">צוותים צהובים</p>
                <p className="text-3xl font-bold text-yellow-600">{statusDistribution.yellow || 0}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">צוותים אדומים</p>
                <p className="text-3xl font-bold text-red-600">{statusDistribution.red || 0}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('teams')}
              className={`flex-1 px-6 py-4 font-semibold transition ${activeTab === 'teams' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              צוותים
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 px-6 py-4 font-semibold transition ${activeTab === 'analytics' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              אנליטיקה
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-6 py-4 font-semibold transition ${activeTab === 'history' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              היסטוריית שיחות
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 px-6 py-4 font-semibold transition ${activeTab === 'notifications' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              התראות
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeTab === 'teams' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">כל הצוותים</h2>
                <button
                  onClick={() => {
                    const nextId = getNextTeamNumber();
                    setNewTeam({
                      teamId: nextId,
                      projectName: '',
                      members: [{ email: '', name: '', role: 'member' }]
                    });
                    setShowCreateTeam(true);
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  צוות חדש
                </button>
              </div>

              {showCreateTeam && (
                <div className="mb-6 p-6 bg-gray-50 rounded-lg border-2 border-purple-300">
                  <h3 className="font-bold text-xl mb-4">צור צוות חדש</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Team ID (אוטומטי)</label>
                      <input
                        type="text"
                        value={newTeam.teamId}
                        disabled
                        className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">שם הפרויקט</label>
                      <input
                        type="text"
                        placeholder="לדוגמה: מערכת IoT חכמה"
                        value={newTeam.projectName}
                        onChange={(e) => setNewTeam({ ...newTeam, projectName: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-bold mb-2">חברי צוות:</h4>
                    {newTeam.members.map((member, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
                        <select
                          value={member.email}
                          onChange={(e) => handleStudentSelect(idx, e.target.value)}
                          className="col-span-2 px-3 py-2 border rounded"
                        >
                          <option value="">בחר סטודנט...</option>
                          {allStudents.map(student => (
                            <option key={student.email} value={student.email}>
                              {student.name} ({student.email})
                            </option>
                          ))}
                        </select>
                        <select
                          value={member.role}
                          onChange={(e) => {
                            const updated = [...newTeam.members];
                            updated[idx].role = e.target.value;
                            setNewTeam({ ...newTeam, members: updated });
                          }}
                          className="px-3 py-2 border rounded"
                        >
                          <option value="member">חבר</option>
                          <option value="leader">מנהיג</option>
                        </select>
                        <button
                          onClick={() => {
                            const updated = newTeam.members.filter((_, i) => i !== idx);
                            setNewTeam({ ...newTeam, members: updated });
                          }}
                          className="bg-red-500 text-white px-2 rounded hover:bg-red-600"
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setNewTeam({
                        ...newTeam,
                        members: [...newTeam.members, { email: '', name: '', role: 'member' }]
                      })}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2"
                    >
                      + הוסף חבר צוות
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={createTeam}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                    >
                      צור צוות
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateTeam(false);
                        setNewTeam({ teamId: '', projectName: '', members: [{ email: '', name: '', role: 'member' }] });
                      }}
                      className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              {editingTeam && (
                <div className="mb-6 p-6 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <h3 className="font-bold text-xl mb-4">ערוך צוות: {editingTeam.teamId}</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">שם הפרויקט</label>
                    <input
                      type="text"
                      value={editingTeam.projectName}
                      onChange={(e) => setEditingTeam({ ...editingTeam, projectName: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div className="mb-4">
                    <h4 className="font-bold mb-2">חברי צוות:</h4>
                    {editingTeam.members.map((member, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
                        <select
                          value={member.email}
                          onChange={(e) => {
                            const student = allStudents.find(s => s.email === e.target.value);
                            if (student) {
                              const updated = [...editingTeam.members];
                              updated[idx] = { ...updated[idx], email: student.email, name: student.name };
                              setEditingTeam({ ...editingTeam, members: updated });
                            }
                          }}
                          className="col-span-2 px-3 py-2 border rounded"
                        >
                          <option value={member.email}>{member.name} ({member.email})</option>
                          {allStudents.map(student => (
                            <option key={student.email} value={student.email}>
                              {student.name} ({student.email})
                            </option>
                          ))}
                        </select>
                        <select
                          value={member.role}
                          onChange={(e) => {
                            const updated = [...editingTeam.members];
                            updated[idx].role = e.target.value;
                            setEditingTeam({ ...editingTeam, members: updated });
                          }}
                          className="px-3 py-2 border rounded"
                        >
                          <option value="member">חבר</option>
                          <option value="leader">מנהיג</option>
                        </select>
                        <button
                          onClick={() => {
                            const updated = editingTeam.members.filter((_, i) => i !== idx);
                            setEditingTeam({ ...editingTeam, members: updated });
                          }}
                          className="bg-red-500 text-white px-2 rounded hover:bg-red-600"
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setEditingTeam({
                        ...editingTeam,
                        members: [...editingTeam.members, { email: '', name: '', role: 'member' }]
                      })}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2"
                    >
                      + הוסף חבר צוות
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={updateTeam}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                    >
                      שמור שינויים
                    </button>
                    <button
                      onClick={() => setEditingTeam(null)}
                      className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-semibold">סטטוס</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Team ID</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">פרויקט</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">חברים</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Sentiment</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">פעילות אחרונה</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {teams.map((team) => (
                    <tr key={team._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="text-2xl">{getStatusIcon(team.status)}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold">{team.teamId}</td>
                      <td className="px-6 py-4">{team.projectName}</td>
                      <td className="px-6 py-4">{team.members?.length || 0}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${team.averageSentiment > 0.3 ? 'bg-green-100 text-green-800' :
                          team.averageSentiment > -0.3 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                          {team.averageSentiment?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(team.lastActivity).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedTeam(team);
                              fetchTeamHistory(team.teamId);
                              setActiveTab('history');
                            }}
                            className="p-2 bg-purple-100 text-purple-600 rounded hover:bg-purple-200"
                            title="היסטוריה"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTeam(team);
                              fetchTeamAnalytics(team.teamId);
                              setActiveTab('analytics');
                            }}
                            className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                            title="אנליטיקה"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingTeam({ ...team })}
                            className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
                            title="ערוך"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTeam(team.teamId)}
                            className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                            title="מחק"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">אנליטיקה</h2>

              {selectedTeam && analytics ? (
                <div className="space-y-8">
                  <div>
                    <h3 className="font-bold text-xl mb-4">
                      {selectedTeam.teamId} - {selectedTeam.projectName}
                    </h3>
                    <p className="text-gray-600">
                      סה"כ שיחות: {analytics.sessionCount} | שיחות מושלמות: {analytics.completedSessionCount || 0}
                    </p>
                  </div>

                  {/* Latest Scores Section */}
                  {analytics.latestSession?.scores && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
                      <h4 className="font-bold text-xl mb-4">📊 ציונים אחרונים</h4>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-4 text-center shadow">
                          <p className="text-sm text-gray-600 mb-1">איכות שיחה</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {analytics.latestSession.scores.conversationQuality}/10
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center shadow">
                          <p className="text-sm text-gray-600 mb-1">חשיבה ביקורתית</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {analytics.latestSession.scores.criticalThinking}/10
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center shadow">
                          <p className="text-sm text-gray-600 mb-1">דינמיקה קבוצתית</p>
                          <p className="text-3xl font-bold text-green-600">
                            {analytics.latestSession.scores.teamDynamics}/10
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center shadow">
                          <p className="text-sm text-gray-600 mb-1">ציון כללי</p>
                          <p className="text-3xl font-bold text-orange-600">
                            {analytics.latestSession.scores.overallScore?.toFixed(1)}/10
                          </p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm">
                          <strong>רמת השתתפות:</strong> {analytics.latestSession.scores.participationLevel}
                        </p>
                        <p className="text-sm">
                          <strong>תאריך:</strong> {new Date(analytics.latestSession.createdAt).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Recommendations Section */}
                  {analytics.latestSession?.finalAnalysis && (
                    <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-300">
                      <h4 className="font-bold text-xl mb-4">💡 המלצות אחרונות</h4>
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {analytics.latestSession.finalAnalysis}
                      </p>
                      {analytics.latestSession.scores?.insights && analytics.latestSession.scores.insights.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-yellow-400">
                          <p className="font-bold mb-2">תובנות נוספות:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {analytics.latestSession.scores.insights.map((insight, idx) => (
                              <li key={idx} className="text-gray-700">{insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-bold mb-4">מגמת Sentiment</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.sentimentTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h4 className="font-bold mb-4">התפלגות סטטוסים</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => entry.name}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">בחר צוות מהטבלה לצפייה באנליטיקה</p>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">היסטוריית שיחות</h2>

              {selectedTeam ? (
                <div>
                  <div className="mb-6">
                    <h3 className="font-bold text-xl">
                      {selectedTeam.teamId} - {selectedTeam.projectName}
                    </h3>
                    <p className="text-gray-600">סה&quot;כ {teamHistory.length} שיחות</p>
                  </div>

                  {teamHistory.length === 0 ? (
                    <p className="text-center text-gray-600 py-8">אין שיחות עדיין</p>
                  ) : (
                    <div className="space-y-6">
                      {teamHistory.map((reflection) => (
                        <div key={reflection._id} className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-lg">{reflection.groupName}</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(reflection.createdAt).toLocaleString('he-IL')}
                              </p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                              {reflection.conversationHistory.length} הודעות
                            </span>
                          </div>

                          {/* Bot 2 Question Outline */}
                          {reflection.metadata?.bot2Outline && (
                            <div className="bg-blue-50 rounded-lg p-4 mb-4 border-r-4 border-blue-500">
                              <h5 className="font-bold mb-2 text-blue-800 flex items-center gap-2">
                                📋 תוכנית השאלות מ-Bot 2
                              </h5>
                              <p className="text-gray-700 whitespace-pre-wrap text-sm">
                                {reflection.metadata.bot2Outline}
                              </p>
                              {reflection.metadata.hasHistory && (
                                <p className="text-xs text-blue-600 mt-2">
                                  ℹ️ תוכנית זו נוצרה על בסיס {reflection.metadata.previousSessionCount} שיחות קודמות
                                </p>
                              )}
                            </div>
                          )}

                          {reflection.finalAnalysis && (
                            <div className="bg-white rounded-lg p-4 mb-4">
                              <h5 className="font-bold mb-2">המלצות:</h5>
                              <p className="text-gray-700 whitespace-pre-wrap">{reflection.finalAnalysis}</p>
                            </div>
                          )}

                          <details className="mt-4">
                            <summary className="cursor-pointer font-semibold text-purple-600 hover:text-purple-700">
                              הצג שיחה מלאה ({reflection.conversationHistory.length} הודעות)
                            </summary>
                            <div className="mt-4 space-y-3 bg-white rounded-lg p-4">
                              {reflection.conversationHistory.map((msg, idx) => (
                                <div key={idx} className={`${msg.role === 'user' ? 'text-left' : 'text-right'}`}>
                                  <div className={`inline-block max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                                    ? 'bg-blue-100 text-gray-800'
                                    : 'bg-purple-100 text-gray-800'
                                    }`}>
                                    <p className="text-xs mb-1 opacity-70">
                                      {msg.role === 'user' ? '👥 סטודנטים' : '🤖 בוט'}
                                    </p>
                                    <p className="text-sm">{msg.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">בחר צוות מהטבלה לצפייה בהיסטוריה</p>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">התראות</h2>
              {notifications.length === 0 ? (
                <p className="text-center text-gray-600 py-8">אין התראות</p>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-4 rounded-lg border-r-4 ${notif.type === 'critical' ? 'bg-red-50 border-red-500' :
                        notif.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                          'bg-blue-50 border-blue-500'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold mb-1">{notif.teamId}</p>
                          <p className="text-gray-700">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notif.createdAt).toLocaleString('he-IL')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${notif.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                          notif.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                          {notif.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EnhancedInstructorDashboard;


