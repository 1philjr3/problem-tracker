import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import SubmitProblemPage from './components/pages/SubmitProblemPage';
import SettingsPage from './components/pages/SettingsPage';
import { googleSheetsAPIService } from './services/googleSheetsAPIService';
import './index.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('submit');

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

  const renderContent = () => {
    switch (activeTab) {
      case 'submit':
        return <SubmitProblemPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <SubmitProblemPage />;
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

export default App;
