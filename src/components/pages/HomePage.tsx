import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cloudDataService, type LocalUser } from '../../services/cloudDataService';
import { SeasonTimer } from '../common/SeasonTimer';

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userStats, setUserStats] = useState<LocalUser | null>(null);
  const [leaderboard, setLeaderboard] = useState<LocalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasonReport, setSeasonReport] = useState<any>(null);

  // Обновляем время каждую секунду
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // Слушаем события обновления данных
    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('userStatsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('userStatsUpdated', handleUpdate);
    };
  }, []);

  const loadData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Получаем имя пользователя
      const displayName = await cloudDataService.getUserDisplayName(
        currentUser.uid, 
        currentUser.email || ''
      );

      // Сохраняем пользователя
      await cloudDataService.saveUser({
        id: currentUser.uid,
        email: currentUser.email || '',
        fullName: displayName,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      });

      // Загружаем данные пользователя и рейтинг
      const userData = await cloudDataService.getUser(currentUser.uid);
      const leaderboard = await cloudDataService.getLeaderboard();

      setUserStats(userData);
      setLeaderboard(leaderboard);

    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSeasonReport = async () => {
    try {
      const report = await cloudDataService.getSeasonReport();
      setSeasonReport(report);
    } catch (error) {
      console.error('Ошибка загрузки отчета:', error);
    }
  };

  const getLevelInfo = (level: string) => {
    switch (level) {
      case 'novice':
        return { emoji: '🏁', title: 'Новичок', range: '1-4 балла', color: 'text-green-600' };
      case 'fighter':
        return { emoji: '🛠️', title: 'Боец', range: '5-9 баллов', color: 'text-blue-600' };
      case 'master':
        return { emoji: '🧠', title: 'Мастер', range: '10+ баллов', color: 'text-purple-600' };
      default:
        return { emoji: '🏁', title: 'Новичок', range: '1-4 балла', color: 'text-green-600' };
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Войдите в систему для просмотра главной страницы</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Приветствие */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Добро пожаловать, {userStats?.fullName || 'Пользователь'}! 👋
            </h1>
            <p className="text-blue-100">
              Система геймификации для сообщения о проблемах на производстве
            </p>
          </div>
          <div className="text-6xl opacity-20">
            🏭
          </div>
        </div>
      </div>

      {/* Статистика пользователя */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : userStats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Уровень */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="text-4xl mr-4">
                {getLevelInfo(userStats.level).emoji}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {getLevelInfo(userStats.level).title}
                </h3>
                <p className="text-sm text-gray-500">
                  {getLevelInfo(userStats.level).range}
                </p>
              </div>
            </div>
          </div>

          {/* Баллы */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="text-4xl mr-4">💎</div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {userStats.totalPoints}
                </h3>
                <p className="text-sm text-gray-500">Общий счет</p>
              </div>
            </div>
          </div>

          {/* Проблемы */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="text-4xl mr-4">📝</div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {userStats.totalProblems}
                </h3>
                <p className="text-sm text-gray-500">Сообщений отправлено</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Текущее время */}
      <div className="text-center">
        <div className="text-xs sm:text-sm text-blue-600 font-medium">
          {formatDate(currentTime)}
        </div>
        <div className="text-lg sm:text-2xl font-bold text-blue-800">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Таймер сезона */}
      <SeasonTimer />

      {/* Топ-5 рейтинга */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">🏆 Топ участников</h2>
          <button
            onClick={loadData}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Обновить
          </button>
        </div>

        {leaderboard.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Пока нет участников в рейтинге
          </p>
        ) : (
          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((user, index) => {
              const levelInfo = getLevelInfo(user.level);
              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                    index === 1 ? 'bg-gray-50 border border-gray-200' :
                    index === 2 ? 'bg-orange-50 border border-orange-200' :
                    'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-600 w-6">
                      #{index + 1}
                    </span>
                    <span className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : levelInfo.emoji}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{user.fullName}</p>
                      <p className="text-sm text-gray-500">
                        {levelInfo.title} • {user.totalProblems} сообщений
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{user.totalPoints}</p>
                    <p className="text-xs text-gray-500">баллов</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Отчет по сезону */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">📊 Статистика сезона</h2>
          <button
            onClick={loadSeasonReport}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Загрузить отчет
          </button>
        </div>

        {seasonReport ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {seasonReport.totalParticipants}
              </div>
              <div className="text-sm text-gray-500">Участников</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {seasonReport.totalProblems}
              </div>
              <div className="text-sm text-gray-500">Проблем</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(seasonReport.categoriesStats || {}).length}
              </div>
              <div className="text-sm text-gray-500">Категорий</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {seasonReport.topUsers?.[0]?.totalPoints || 0}
              </div>
              <div className="text-sm text-gray-500">Макс баллов</div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Нажмите "Загрузить отчет" для просмотра статистики
          </p>
        )}
      </div>

      {/* Информация о системе */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">ℹ️ Как работает система:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">🎯 Геймификация:</h4>
            <ul className="space-y-1">
              <li>• +1 балл за каждую проблему</li>
              <li>• До +10 бонусных баллов от админа</li>
              <li>• 3 уровня: Новичок → Боец → Мастер</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">☁️ Облачное хранение:</h4>
            <ul className="space-y-1">
              <li>• Данные синхронизируются между всеми</li>
              <li>• Общий рейтинг для всех участников</li>
              <li>• Админ может управлять системой</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => window.location.hash = '#/submit'}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="font-medium text-blue-900">Сообщить о проблеме</div>
            <div className="text-sm text-blue-600">Получить +1 балл</div>
          </button>
          
          <button
            onClick={() => window.location.hash = '#/leaderboard'}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
          >
            <div className="text-2xl mb-2">🏆</div>
            <div className="font-medium text-green-900">Посмотреть рейтинг</div>
            <div className="text-sm text-green-600">Узнать свою позицию</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 