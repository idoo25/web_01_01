
const Tabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'welcome', label: 'ברוכים הבאים' },
    { id: 'interview', label: 'ראיון חדש' },
    { id: 'history', label: 'היסטוריה' },
    { id: 'groupreflection', label: 'רפלקציה קבוצתית' } // ← טאב חדש
  ];

  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === tab.id
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
              : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-md'
          }`}
          style={{ direction: 'rtl' }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
