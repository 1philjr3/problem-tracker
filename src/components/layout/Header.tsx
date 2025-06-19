import React, { useState, useEffect } from 'react';
import { cloudDataService, type LocalUser } from '../../services/cloudDataService';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [userStats, setUserStats] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Функция для загрузки статистики пользователя
  const loadUserStats = async () => {
    if (!currentUser) {
      setUserStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Получаем имя пользователя
      const displayName = await cloudDataService.getUserDisplayName(
        currentUser.uid, 
        currentUser.email || ''
      );

      // Сохраняем/обновляем пользователя
      await cloudDataService.saveUser({
        id: currentUser.uid,
        email: currentUser.email || '',
        fullName: displayName,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      });

      // Получаем обновленные данные пользователя
      const userData = await cloudDataService.getUser(currentUser.uid);
      setUserStats(userData);

    } catch (error) {
      console.error('Ошибка загрузки статистики пользователя:', error);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем статистику при монтировании и изменении пользователя
  useEffect(() => {
    loadUserStats();
  }, [currentUser]);

  // Слушаем события обновления статистики
  useEffect(() => {
    const handleStatsUpdate = () => {
      loadUserStats();
    };

    window.addEventListener('userStatsUpdated', handleStatsUpdate);
    return () => {
      window.removeEventListener('userStatsUpdated', handleStatsUpdate);
    };
  }, []);

  const getLevelInfo = (level: string) => {
    switch (level) {
      case 'novice':
        return { emoji: '🏁', name: 'Новичок', range: '1-4 балла' };
      case 'fighter':
        return { emoji: '🛠️', name: 'Боец', range: '5-9 баллов' };
      case 'master':
        return { emoji: '🧠', name: 'Мастер', range: '10+ баллов' };
      default:
        return { emoji: '🏁', name: 'Новичок', range: '1-4 балла' };
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Логотип и название */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              🏆 Problem Tracker
            </h1>
          </div>

          {/* Информация о пользователе */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ) : userStats ? (
              <div className="flex items-center space-x-3">
                {/* Статистика */}
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {userStats.fullName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getLevelInfo(userStats.level).emoji} {getLevelInfo(userStats.level).name} • {userStats.totalPoints} баллов
                  </div>
                </div>

                {/* Кнопка обновления */}
                <button
                  onClick={loadUserStats}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Обновить статистику"
                >
                  🔄
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                {currentUser.email}
              </div>
            )}

            {/* Кнопка выхода */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 