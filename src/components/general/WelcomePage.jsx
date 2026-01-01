
const WelcomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
          Interview Master Pro
        </h1>
        <p className="text-lg sm:text-xl text-gray-700">
          Your intelligent companion for conducting perfect interviews
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {[
            { title: 'Smart Questions', desc: 'AI-powered questions tailored to your interview topics' },
            { title: 'Easy Management', desc: 'Organize and track all your interviews effortlessly' },
            { title: 'Quick Summaries', desc: 'Get AI-generated summaries of your interviews instantly' },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg transform hover:scale-105 transition-transform"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-purple-600 mb-3">{feature.title}</h3>
              <p className="text-sm sm:text-base text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
