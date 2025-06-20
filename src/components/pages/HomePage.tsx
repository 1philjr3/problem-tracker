import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SeasonTimer } from '../common/SeasonTimer';
import { cloudDataService } from '../../services/cloudDataService';
import { getLevelInfo } from '../../types';

export function HomePage() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<{
    points: number;
    problems: number;
    level: 'novice' | 'fighter' | 'master';
  }>({ points: 0, problems: 0, level: 'novice' });
  const [seasonSettings, setSeasonSettings] = useState<any>(null);

  useEffect(() => {
    if (currentUser) {
      loadUserStats();
      loadSeasonSettings();
    }
  }, [currentUser]);

  const loadUserStats = async () => {
    if (!currentUser) return;
    
    try {
      const leaderboard = await cloudDataService.getLeaderboard();
      const userEntry = leaderboard.find(entry => entry.userId === currentUser.uid);
      
      if (userEntry) {
        setUserStats({
          points: userEntry.points,
          problems: userEntry.answersCount,
          level: userEntry.level
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const loadSeasonSettings = async () => {
    try {
      const settings = await cloudDataService.getSeasonSettings();
      setSeasonSettings(settings);
    } catch (error) {
      console.error('Ошибка загрузки настроек сезона:', error);
    }
  };

  const levelInfo = getLevelInfo(userStats.level);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Уведомление об успешной отправке */}
      {location.state?.message && (
        <div className={`mb-6 p-4 rounded-lg ${
          location.state.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <p className="font-medium">{location.state.message}</p>
        </div>
      )}

      {/* Приветствие */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Добро пожаловать в систему ПНР!
        </h1>
        <p className="text-gray-600">
          Находите проблемы, получайте баллы, соревнуйтесь с коллегами
        </p>
      </div>

      {/* Статистика пользователя */}
      {currentUser && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Ваша статистика</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{userStats.points}</div>
              <div className="text-sm text-gray-600">Баллов</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{userStats.problems}</div>
              <div className="text-sm text-gray-600">Проблем найдено</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-1">{levelInfo.icon}</div>
              <div className={`text-sm font-medium ${levelInfo.color}`}>{levelInfo.name}</div>
            </div>
          </div>
        </div>
      )}

      {/* Таймер сезона */}
      {seasonSettings && seasonSettings.isActive && (
        <SeasonTimer />
      )}

      {/* Призыв к действию */}
      <div className="bg-indigo-50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-indigo-900 mb-2">
          Нашли проблему?
        </h3>
        <p className="text-indigo-700 mb-4">
          Сообщите о ней и получите баллы за вклад в улучшение производства
        </p>
        <button
          onClick={() => navigate('/submit')}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Сообщить о проблеме
        </button>
      </div>

      {/* Информация о системе */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Как это работает?</h3>
          <ol className="space-y-2 text-sm text-gray-600">
            <li>1. Обнаружьте проблему на производстве</li>
            <li>2. Сделайте фото и опишите проблему</li>
            <li>3. Отправьте через форму</li>
            <li>4. Получите баллы и соревнуйтесь с коллегами</li>
          </ol>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Система баллов</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• За каждую проблему: <span className="font-medium">+1 балл</span></li>
            <li>• Бонус от админа: <span className="font-medium">до +10 баллов</span></li>
            <li>• 🏁 Новичок: 1-4 балла</li>
            <li>• 🛠️ Боец: 5-9 баллов</li>
            <li>• 🧠 Мастер: 10+ баллов</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 