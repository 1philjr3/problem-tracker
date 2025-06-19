import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cloudDataService } from '../../services/cloudDataService';

interface LeaderboardEntry {
  id: string;
  fullName: string;
  totalPoints: number;
  totalProblems: number;
  level: 'novice' | 'fighter' | 'master';
}

const LeaderboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadLeaderboard();
    checkAdminStatus();
  }, [currentUser]);

  const checkAdminStatus = async () => {
    if (currentUser && currentUser.email === 'admin@mail.ru') {
      const adminStatus = await cloudDataService.isAdmin(currentUser.uid, currentUser.email || '');
      setIsAdmin(adminStatus);
    } else {
      setIsAdmin(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Загружаем реальные данные из Firebase Firestore
      const users = await cloudDataService.getLeaderboard();
      setLeaderboard(users);
      
      console.log('✅ Загружен рейтинг из Firebase:', users.length, 'пользователей');

    } catch (error) {
      console.error('❌ Ошибка загрузки рейтинга:', error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!currentUser || !isAdmin) {
      alert('❌ Доступ запрещен');
      return;
    }

    if (window.confirm(`Вы уверены, что хотите удалить пользователя "${userName}"? Это действие нельзя отменить.`)) {
      try {
        await cloudDataService.deleteUser(userId, currentUser.uid, currentUser.email || '');
        alert(`✅ Пользователь "${userName}" удален`);
        await loadLeaderboard();
        
        // Уведомляем другие компоненты
        window.dispatchEvent(new CustomEvent('userStatsUpdated'));
      } catch (error: any) {
        alert(`❌ Ошибка удаления: ${error.message}`);
      }
    }
  };

  const getLevelInfo = (points: number) => {
    if (points >= 10) return { name: 'Мастер', emoji: '🧠', color: 'text-violet-600' };
    if (points >= 5) return { name: 'Боец', emoji: '🛠️', color: 'text-amber-600' };
    return { name: 'Новичок', emoji: '🏁', color: 'text-green-600' };
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🏆';
    return '🎯';
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (rank === 2) return 'text-gray-600 bg-gray-50 border-gray-200';
    if (rank === 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (rank <= 10) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка рейтинга из Firebase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
      {/* Заголовок */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          🏆 Рейтинг участников
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Общий рейтинг всех пользователей в реальном времени
        </p>
      </div>

      {/* Информация о системе */}
      <div className="mb-6 sm:mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">☁️</span>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800">Облачная синхронизация</h3>
            <p className="text-sm text-blue-600">
              Рейтинг синхронизируется между всеми пользователями в реальном времени через Firebase Firestore.<br />
              Все участники видят актуальную информацию о баллах и рейтинге.
            </p>
            {isAdmin && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-xs text-red-600 font-medium">
                  🔑 Режим администратора: доступны дополнительные функции управления
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Топ-3 */}
      {leaderboard.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">🏆 Топ-3 лидера</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {leaderboard.slice(0, 3).map((user, index) => {
              const rank = index + 1;
              const level = getLevelInfo(user.totalPoints);
              return (
                <div key={user.id} className={`p-4 rounded-xl border-2 ${getRankColor(rank)}`}>
                  <div className="text-center">
                    <div className="text-3xl mb-2">{getRankEmoji(rank)}</div>
                    <h3 className="font-bold text-lg mb-1">{user.fullName}</h3>
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span className={`${level.color} font-semibold`}>{level.emoji} {level.name}</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{user.totalPoints} баллов</div>
                    <div className="text-sm text-gray-600">{user.totalProblems} проблем</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Полный рейтинг */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">📊 Полный рейтинг ({leaderboard.length} участников)</h2>
        </div>
        
        {leaderboard.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Пока нет участников</h3>
            <p className="text-gray-600">Станьте первым! Отправьте проблему и получите баллы.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {leaderboard.map((user, index) => {
              const rank = index + 1;
              const level = getLevelInfo(user.totalPoints);
              return (
                <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold text-gray-400 w-8 text-center">
                        {rank}
                      </div>
                      <div className="text-2xl">
                        {getRankEmoji(rank)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.fullName}</h3>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className={`${level.color} font-medium`}>
                            {level.emoji} {level.name}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-600">{user.totalProblems} проблем</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {user.totalPoints}
                      </div>
                      <div className="text-sm text-gray-500">баллов</div>
                    </div>

                    {/* Кнопка удаления для админа */}
                    {isAdmin && user.fullName !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.fullName)}
                        className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium"
                        title="Удалить пользователя"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Легенда уровней */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">📈 Система уровней</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">🏁</span>
            <span className="font-medium">Новичок:</span>
            <span className="text-gray-600">1-4 балла</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-amber-600">🛠️</span>
            <span className="font-medium">Боец:</span>
            <span className="text-gray-600">5-9 баллов</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-violet-600">🧠</span>
            <span className="font-medium">Мастер:</span>
            <span className="text-gray-600">10+ баллов</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage; 