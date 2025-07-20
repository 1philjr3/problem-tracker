import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import SubmitProblemPage from './components/pages/SubmitProblemPage';
import SettingsPage from './components/pages/SettingsPage';
import { googleSheetsAPIService } from './services/googleSheetsAPIService';
import './index.css';

const AppContent: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('submit'); // Делаем страницу отправки стартовой

  // Инициализация Google Sheets сервиса при загрузке приложения
  useEffect(() => {
    const initGoogleSheets = () => {
      const savedUrl = localStorage.getItem('google_sheets_web_app_url');
      if (savedUrl) {
        googleSheetsAPIService.setWebAppUrl(savedUrl);
        console.log('✅ Google Sheets сервис инициализирован');
      }
    };
    
    initGoogleSheets();
  }, []);

  // Показываем загрузку пока идет инициализация
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Показываем страницу авторизации если пользователь не вошел
  if (!currentUser || !userProfile) {
    return <AuthPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'submit':
        return <SubmitProblemPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <SubmitProblemPage />; // По умолчанию показываем страницу отправки
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
