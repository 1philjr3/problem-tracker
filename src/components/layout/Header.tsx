import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cloudDataService } from '../../services/cloudDataService';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [userStats, setUserStats] = useState<{
    fullName: string;
    totalPoints: number;
    totalProblems: number;
    level: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadUserStats();
    }
  }, [currentUser]);

  useEffect(() => {
    // Слушаем событие обновления статистики
    const handleStatsUpdate = () => {
      loadUserStats();
    };

    window.addEventListener('userStatsUpdated', handleStatsUpdate);
    
    return () => {
      window.removeEventListener('userStatsUpdated', handleStatsUpdate);
    };
  }, [currentUser]);

  const loadUserStats = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Пользователь';

      // Получаем рейтинг
      const leaderboard = await cloudDataService.getLeaderboard();
      const userData = leaderboard.find((user: any) => 
        (user.id === currentUser.uid) || 
        (user.userId === currentUser.uid)
      ) as any;

      if (userData) {
        const totalPoints = userData.totalPoints || userData.points || 0;
        setUserStats({
          fullName: userData.fullName || displayName,
          totalPoints: totalPoints,
          totalProblems: userData.totalProblems || userData.answersCount || 0,
          level: userData.level || 'novice'
        });
      } else {
        // Если пользователя нет в рейтинге, показываем базовые данные
        setUserStats({
          fullName: displayName,
          totalPoints: 0,
          totalProblems: 0,
          level: 'novice'
        });
      }

      console.log('✅ Статистика загружена в Header');

    } catch (error) {
      console.error('❌ Ошибка загрузки статистики в Header:', error);
      
      // В случае ошибки показываем хотя бы имя
      const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Пользователь';
      setUserStats({
        fullName: displayName,
        totalPoints: 0,
        totalProblems: 0,
        level: 'novice'
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = (level: string) => {
    const levels: Record<string, { name: string; emoji: string; color: string }> = {
      novice: { name: 'Новичок', emoji: '🏁', color: 'text-green-600' },
      fighter: { name: 'Боец', emoji: '🛠️', color: 'text-blue-600' },
      master: { name: 'Мастер', emoji: '🧠', color: 'text-purple-600' },
    };
    return levels[level] || levels.novice;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Логотип */}
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🏭</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Система отчетов ПНР</h1>
              <p className="text-sm text-gray-500">Геймификация производственных процессов</p>
            </div>
          </div>

          {/* Профиль пользователя */}
          {currentUser && (
            <div className="flex items-center space-x-4">
              {/* Информация о пользователе */}
              <div className="text-right">
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-300 rounded w-20 mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded w-32"></div>
                    </div>
                  </div>
                ) : userStats ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{userStats.fullName}</span>
                      <span className="text-2xl">{getLevelInfo(userStats.level).emoji}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 ${getLevelInfo(userStats.level).color}`}>
                        {getLevelInfo(userStats.level).name}
                      </span>
                      <span>💎 {userStats.totalPoints} баллов</span>
                      <span>📝 {userStats.totalProblems} ответов</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {currentUser.displayName || currentUser.email || 'Пользователь'}
                      </span>
                      <span className="text-2xl">🏁</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-green-600">
                        Новичок
                      </span>
                      <span>💎 0 баллов</span>
                      <span>📝 0 ответов</span>
                    </div>
                  </>
                )}
              </div>

              {/* Кнопка обновления */}
              <button
                onClick={loadUserStats}
                disabled={loading}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Обновить статистику"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Кнопка выхода */}
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Выйти"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 