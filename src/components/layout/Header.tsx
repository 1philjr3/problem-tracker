import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cloudDataService } from '../../services/cloudDataService';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [userStats, setUserStats] = useState({
    displayName: '',
    totalPoints: 0,
    totalProblems: 0,
    level: 'novice' as 'novice' | 'fighter' | 'master'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadUserStats();
      
      // Слушаем события обновления статистики
      const handleStatsUpdate = () => {
        loadUserStats();
      };
      
      window.addEventListener('userStatsUpdated', handleStatsUpdate);
      
      return () => {
        window.removeEventListener('userStatsUpdated', handleStatsUpdate);
      };
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadUserStats = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Получаем статистику пользователя из Firebase
      const stats = await cloudDataService.getUserStats(currentUser.uid);
      const displayName = await cloudDataService.getUserDisplayName(currentUser.uid, currentUser.email || '');
      
      setUserStats({
        displayName,
        totalPoints: stats.totalPoints,
        totalProblems: stats.totalProblems,
        level: stats.level
      });
      
      console.log('✅ Header: Загружена статистика пользователя из Firebase:', stats);
      
    } catch (error) {
      console.error('❌ Header: Ошибка загрузки статистики:', error);
      // Устанавливаем значения по умолчанию
      setUserStats({
        displayName: currentUser.email?.split('@')[0] || 'Пользователь',
        totalPoints: 0,
        totalProblems: 0,
        level: 'novice'
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = (level: string) => {
    switch (level) {
      case 'master':
        return { name: 'Мастер', emoji: '🧠', color: 'text-violet-600' };
      case 'fighter':
        return { name: 'Боец', emoji: '🛠️', color: 'text-amber-600' };
      default:
        return { name: 'Новичок', emoji: '🏁', color: 'text-green-600' };
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  };

  const handleRefreshStats = () => {
    loadUserStats();
  };

  if (!currentUser) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                🏆 Problem Tracker
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              Войдите в систему
            </div>
          </div>
        </div>
      </header>
    );
  }

  const levelInfo = getLevelInfo(userStats.level);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Логотип */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              🏆 Problem Tracker
            </h1>
          </div>

          {/* Информация о пользователе */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm text-gray-600">Загрузка...</span>
              </div>
            ) : (
              <>
                {/* Статистика пользователя */}
                <div className="hidden sm:flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className={`${levelInfo.color} font-medium`}>
                      {levelInfo.emoji} {levelInfo.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-600">Баллы:</span>
                    <span className="font-semibold text-blue-600">{userStats.totalPoints}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-600">Проблем:</span>
                    <span className="font-semibold text-gray-900">{userStats.totalProblems}</span>
                  </div>
                </div>

                {/* Кнопка обновления */}
                <button
                  onClick={handleRefreshStats}
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  title="Обновить статистику"
                >
                  🔄
                </button>

                {/* Профиль пользователя */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {userStats.displayName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {currentUser.email}
                    </div>
                  </div>
                  
                  {/* Кнопка выхода */}
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Выйти
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Мобильная статистика */}
        {!loading && (
          <div className="sm:hidden pb-3 flex items-center justify-center space-x-4 text-sm">
            <span className={`${levelInfo.color} font-medium`}>
              {levelInfo.emoji} {levelInfo.name}
            </span>
            <span className="text-gray-600">
              Баллы: <span className="font-semibold text-blue-600">{userStats.totalPoints}</span>
            </span>
            <span className="text-gray-600">
              Проблем: <span className="font-semibold text-gray-900">{userStats.totalProblems}</span>
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 