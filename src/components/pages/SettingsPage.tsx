import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { googleSheetsAPIService } from '../../services/googleSheetsAPIService';
import { localDataService } from '../../services/localDataService';

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [webAppUrl, setWebAppUrl] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [localStats, setLocalStats] = useState({ problems: 0, users: 0 });

  useEffect(() => {
    if (currentUser?.email === 'admin@mail.ru') {
      setIsAdmin(true);
    }
    
    // Загружаем сохраненный URL
    const savedUrl = googleSheetsAPIService.getWebAppUrl();
    if (savedUrl) {
      setWebAppUrl(savedUrl);
    }

    // Загружаем локальную статистику
    loadLocalStats();
  }, [currentUser]);

  const loadLocalStats = async () => {
    const data = await localDataService.getAllData();
    setLocalStats({
      problems: data.problems.length,
      users: data.users.length
    });
  };

  const handleSaveUrl = () => {
    googleSheetsAPIService.setWebAppUrl(webAppUrl);
    alert('✅ URL сохранен!');
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      const isConnected = await googleSheetsAPIService.checkConnection();
      setTestStatus(isConnected ? 'success' : 'error');
    } catch (error) {
      setTestStatus('error');
    }
  };

  const handleSyncData = async () => {
    setSyncStatus('syncing');
    try {
      const data = await localDataService.getAllData();
      await googleSheetsAPIService.syncAllData(data.problems, data.users);
      setSyncStatus('success');
      alert('✅ Данные синхронизированы с Google Sheets!');
    } catch (error) {
      setSyncStatus('error');
      alert('❌ Ошибка синхронизации');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Доступ запрещен</h2>
          <p className="text-red-600">Эта страница доступна только администраторам</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Настройки Google Sheets</h1>
        <p className="text-gray-600">Настройка интеграции с Google Sheets для синхронизации данных</p>
      </div>

      {/* Инструкция */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">📋 Как настроить Google Apps Script:</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Откройте вашу Google таблицу</li>
          <li>Перейдите в Extensions → Apps Script</li>
          <li>Скопируйте код из файла <code className="bg-blue-100 px-1 rounded">google-apps-script.js</code></li>
          <li>Нажмите Deploy → New Deployment → Web app</li>
          <li>Выберите "Anyone" в поле "Who has access"</li>
          <li>Скопируйте URL и вставьте его ниже</li>
        </ol>
      </div>

      {/* Настройка URL */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 Google Apps Script Web App URL</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL вашего Web App:
            </label>
            <input
              type="url"
              value={webAppUrl}
              onChange={(e) => setWebAppUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveUrl}
              disabled={!webAppUrl}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              💾 Сохранить URL
            </button>

            <button
              onClick={handleTestConnection}
              disabled={!webAppUrl || testStatus === 'testing'}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {testStatus === 'testing' ? '⏳ Проверка...' : '🔍 Проверить соединение'}
            </button>
          </div>

          {/* Статус проверки */}
          {testStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-sm">✅ Соединение успешно установлено!</p>
            </div>
          )}
          {testStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">❌ Не удалось подключиться. Проверьте URL и настройки.</p>
            </div>
          )}
        </div>
      </div>

      {/* Синхронизация данных */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 Синхронизация данных</h3>
        
        <div className="space-y-4">
          {/* Статистика */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Локальные данные:</strong><br />
              • Проблем: {localStats.problems}<br />
              • Пользователей: {localStats.users}
            </p>
          </div>

          <button
            onClick={handleSyncData}
            disabled={!webAppUrl || syncStatus === 'syncing'}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {syncStatus === 'syncing' ? '⏳ Синхронизация...' : '🚀 Синхронизировать все данные с Google Sheets'}
          </button>

          {/* Статус синхронизации */}
          {syncStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-sm">✅ Данные успешно синхронизированы!</p>
            </div>
          )}
          {syncStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">❌ Ошибка синхронизации. Проверьте настройки.</p>
            </div>
          )}
        </div>
      </div>

      {/* Информация о Google Sheets */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 О синхронизации с Google Sheets</h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>• Все данные дублируются в Google Sheets для резервного копирования</li>
          <li>• Основная работа продолжается с локальными данными для скорости</li>
          <li>• Google Sheets служит как облачное хранилище и отчетность</li>
          <li>• Синхронизация происходит в фоновом режиме</li>
          <li>• Вы можете просматривать данные прямо в таблице</li>
        </ul>
      </div>
    </div>
  );
};

export default SettingsPage; 