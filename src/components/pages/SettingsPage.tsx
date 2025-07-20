import React, { useState, useEffect } from 'react';
import { googleSheetsAPIService } from '../../services/googleSheetsAPIService';

const SettingsPage: React.FC = () => {
  const [webAppUrl, setWebAppUrl] = useState('');
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadSettings();
    updateUnsyncedCount();
  }, []);

  const loadSettings = () => {
    // Загружаем сохраненный URL из localStorage
    const savedUrl = localStorage.getItem('google_sheets_web_app_url');
    if (savedUrl) {
      setWebAppUrl(savedUrl);
      googleSheetsAPIService.setWebAppUrl(savedUrl);
    }
  };

  const updateUnsyncedCount = () => {
    const count = googleSheetsAPIService.getUnsyncedCount();
    setUnsyncedCount(count);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Сохраняем URL в localStorage
      localStorage.setItem('google_sheets_web_app_url', webAppUrl);
      googleSheetsAPIService.setWebAppUrl(webAppUrl);
      
      alert('✅ Настройки сохранены!');
      
      // Если есть несинхронизированные данные, предлагаем синхронизировать
      if (unsyncedCount > 0) {
        const shouldSync = window.confirm(
          `Найдено ${unsyncedCount} несинхронизированных записей. Синхронизировать сейчас?`
        );
        if (shouldSync) {
          await handleSync();
        }
      }
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      alert('❌ Ошибка сохранения настроек');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!webAppUrl) {
      alert('Введите URL Web App');
      return;
    }

    setTestStatus('testing');
    try {
      // Тестируем подключение GET запросом
      const response = await fetch(webAppUrl);
      const data = await response.json();
      
      if (data.status === 'success') {
        setTestStatus('success');
        alert('✅ Подключение успешно установлено!');
      } else {
        setTestStatus('error');
        alert('❌ Ошибка подключения. Проверьте URL.');
      }
    } catch (error) {
      setTestStatus('error');
      alert('❌ Не удалось подключиться. Проверьте URL и настройки Web App.');
      console.error('Ошибка тестирования:', error);
    }
  };

  const handleSync = async () => {
    try {
      await googleSheetsAPIService.syncLocalData();
      updateUnsyncedCount();
      alert('✅ Синхронизация завершена!');
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      alert('❌ Ошибка синхронизации');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">⚙️ Настройки системы</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">📊 Интеграция с Google Sheets</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Apps Script Web App URL
          </label>
          <input
            type="text"
            value={webAppUrl}
            onChange={(e) => setWebAppUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-600">
            Введите URL вашего развёрнутого Google Apps Script
          </p>
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={handleTestConnection}
            disabled={!webAppUrl || testStatus === 'testing'}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testStatus === 'testing' ? '🔄 Проверка...' : '🧪 Тест подключения'}
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '💾 Сохранение...' : '💾 Сохранить настройки'}
          </button>
        </div>

        {testStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
            <p className="text-green-800">✅ Подключение установлено успешно!</p>
          </div>
        )}

        {testStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-red-800">❌ Ошибка подключения. Проверьте URL и настройки.</p>
          </div>
        )}

        {unsyncedCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-4">
            <p className="text-yellow-800 mb-2">
              ⚠️ Есть несинхронизированные данные: {unsyncedCount} записей
            </p>
            <button
              onClick={handleSync}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              🔄 Синхронизировать сейчас
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">📖 Инструкция по настройке</h2>
        
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Откройте вашу Google таблицу</li>
          <li>Перейдите в <strong>Расширения → Apps Script</strong></li>
          <li>Скопируйте код из файла <code className="bg-gray-100 px-1 py-0.5 rounded">google-apps-script.js</code></li>
          <li>Сохраните и разверните как Web App</li>
          <li>Скопируйте URL развёртывания и вставьте выше</li>
        </ol>
        
        <div className="mt-4">
          <a
            href="https://docs.google.com/spreadsheets/d/1PHrQ8ZwjrOc4_9QuvpQltuMpuSUGIlcb96lp6korbTA/edit?hl=ru&gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            🔗 Открыть Google таблицу →
          </a>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 