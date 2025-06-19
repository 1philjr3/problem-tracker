import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { cloudDataService } from './services/cloudDataService';
import AuthPage from './components/auth/AuthPage';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import HomePage from './components/pages/HomePage';
import SubmitProblemPage from './components/pages/SubmitProblemPage';
import LeaderboardPage from './components/pages/LeaderboardPage';
import AllProblemsPage from './components/pages/AllProblemsPage';
import './index.css';

const AppContent: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [dataServiceInitialized, setDataServiceInitialized] = useState(false);

  // Инициализируем cloudDataService при запуске
  useEffect(() => {
    const initializeDataService = async () => {
      try {
        await cloudDataService.initialize();
        setDataServiceInitialized(true);
        console.log('✅ CloudDataService инициализирован');
      } catch (error) {
        console.error('❌ Ошибка инициализации CloudDataService:', error);
        setDataServiceInitialized(true); // Продолжаем работу даже при ошибке
      }
    };

    initializeDataService();
  }, []);

  // Показываем загрузку пока идет инициализация
  if (loading || !dataServiceInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!dataServiceInitialized ? 'Инициализация базы данных...' : 'Загрузка...'}
          </p>
        </div>
      </div>
    );
  }

  // Показываем страницу авторизации если пользователь не вошел
  if (!currentUser || !userProfile) {
    return <AuthPage />;
  }

  // Временно отключим проверку email для тестирования
  // Раскомментируйте после настройки Firebase
  /*
  if (!currentUser.emailVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="card p-8 text-center">
            <div className="text-6xl mb-4">📧</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Подтвердите email</h2>
            <p className="text-gray-600 mb-6">
              Мы отправили письмо с подтверждением на ваш email. 
              Пожалуйста, перейдите по ссылке в письме, чтобы подтвердить свой аккаунт.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Я подтвердил email
            </button>
          </div>
        </div>
      </div>
    );
  }
  */

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'submit':
        return <SubmitProblemPage />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'all-problems':
        return <AllProblemsPage />;
      case 'profile':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">👤 Профиль</h1>
              <p className="text-gray-600 mb-8">Страница профиля в разработке...</p>
            </div>
          </div>
        );
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="pb-8">
        {renderContent()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
