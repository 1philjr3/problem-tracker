import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cloudDataService } from '../../services/cloudDataService';
import { SeasonTimer } from '../common/SeasonTimer';

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [userStats, setUserStats] = useState({
    displayName: '',
    totalPoints: 0,
    totalProblems: 0,
    level: 'novice' as 'novice' | 'fighter' | 'master'
  });
  const [seasonSettings, setSeasonSettings] = useState({
    currentSeason: 'Конкурс ПНР',
    seasonStartDate: new Date().toISOString(),
    seasonEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    isFinished: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadData();
      
      // Слушаем события обновления
      const handleUpdate = () => {
        loadData();
      };
      
      window.addEventListener('userStatsUpdated', handleUpdate);
      
      return () => {
        window.removeEventListener('userStatsUpdated', handleUpdate);
      };
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Загружаем данные пользователя и настройки сезона
      const [userStatsData, seasonData] = await Promise.all([
        cloudDataService.getUserStats ? cloudDataService.getUserStats(currentUser.uid) : Promise.resolve({ totalPoints: 0, totalProblems: 0, level: 'novice' as const }),
        cloudDataService.getSeasonSettings()
      ]);
      
      const displayName = await cloudDataService.getUserDisplayName(currentUser.uid, currentUser.email || '');
      
      setUserStats({
        displayName,
        totalPoints: userStatsData.totalPoints,
        totalProblems: userStatsData.totalProblems,
        level: userStatsData.level
      });
      
      setSeasonSettings(seasonData);
      
      console.log('✅ HomePage: Данные загружены из Firebase');
      
    } catch (error) {
      console.error('❌ HomePage: Ошибка загрузки данных:', error);
      // Устанавливаем значения по умолчанию
      if (currentUser) {
        setUserStats({
          displayName: currentUser.email?.split('@')[0] || 'Пользователь',
          totalPoints: 0,
          totalProblems: 0,
          level: 'novice'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = (level: string) => {
    switch (level) {
      case 'master':
        return { name: 'Мастер', emoji: '🧠', color: 'text-violet-600', bgColor: 'bg-violet-100' };
      case 'fighter':
        return { name: 'Боец', emoji: '🛠️', color: 'text-amber-600', bgColor: 'bg-amber-100' };
      default:
        return { name: 'Новичок', emoji: '🏁', color: 'text-green-600', bgColor: 'bg-green-100' };
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Добро пожаловать!</h2>
          <p className="text-gray-600">Войдите в систему, чтобы начать отправлять проблемы и получать баллы</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(userStats.level);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
      {/* Приветствие */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Добро пожаловать, {userStats.displayName}! 👋
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Отправляйте проблемы, получайте баллы и поднимайтесь в рейтинге
        </p>
      </div>

      {/* Информация о системе */}
      <div className="mb-6 sm:mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">☁️</span>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800">Облачная синхронизация</h3>
            <p className="text-sm text-blue-600">
              Ваши данные синхронизируются с Firebase Firestore в реальном времени.<br />
              Все участники видят актуальную информацию о рейтинге и проблемах.
            </p>
          </div>
        </div>
      </div>

      {/* Статистика пользователя */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Уровень */}
        <div className={`${levelInfo.bgColor} rounded-lg p-4 sm:p-6 text-center`}>
          <div className="text-3xl sm:text-4xl mb-2">{levelInfo.emoji}</div>
          <div className={`text-lg sm:text-xl font-bold ${levelInfo.color} mb-1`}>
            {levelInfo.name}
          </div>
          <div className="text-sm text-gray-600">Ваш уровень</div>
        </div>

        {/* Баллы */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 text-center">
          <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">
            {userStats.totalPoints}
          </div>
          <div className="text-lg font-semibold text-gray-900 mb-1">Баллов</div>
          <div className="text-sm text-gray-600">Всего заработано</div>
        </div>

        {/* Проблемы */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 text-center">
          <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">
            {userStats.totalProblems}
          </div>
          <div className="text-lg font-semibold text-gray-900 mb-1">Проблем</div>
          <div className="text-sm text-gray-600">Отправлено</div>
        </div>
      </div>

      {/* Таймер сезона */}
      <div className="mb-6 sm:mb-8">
        <SeasonTimer 
          seasonName={seasonSettings.currentSeason}
          endDate={seasonSettings.seasonEndDate}
          isActive={seasonSettings.isActive}
          isFinished={seasonSettings.isFinished}
        />
      </div>

      {/* Система уровней */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">📈 Система уровней</h2>
        
        <div className="space-y-4">
          {/* Новичок */}
          <div className={`flex items-center space-x-4 p-3 rounded-lg ${
            userStats.level === 'novice' ? 'bg-green-100 border-2 border-green-300' : 'bg-gray-50'
          }`}>
            <div className="text-2xl">🏁</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-green-600">Новичок</span>
                {userStats.level === 'novice' && (
                  <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                    Ваш уровень
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">1-4 балла • Начинающий участник</div>
            </div>
          </div>

          {/* Боец */}
          <div className={`flex items-center space-x-4 p-3 rounded-lg ${
            userStats.level === 'fighter' ? 'bg-amber-100 border-2 border-amber-300' : 'bg-gray-50'
          }`}>
            <div className="text-2xl">🛠️</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-amber-600">Боец</span>
                {userStats.level === 'fighter' && (
                  <span className="bg-amber-600 text-white text-xs px-2 py-1 rounded-full">
                    Ваш уровень
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">5-9 баллов • Активный участник</div>
            </div>
          </div>

          {/* Мастер */}
          <div className={`flex items-center space-x-4 p-3 rounded-lg ${
            userStats.level === 'master' ? 'bg-violet-100 border-2 border-violet-300' : 'bg-gray-50'
          }`}>
            <div className="text-2xl">🧠</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-violet-600">Мастер</span>
                {userStats.level === 'master' && (
                  <span className="bg-violet-600 text-white text-xs px-2 py-1 rounded-full">
                    Ваш уровень
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">10+ баллов • Эксперт по качеству</div>
            </div>
          </div>
        </div>
      </div>

      {/* Как получить баллы */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">💡 Как получить баллы</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 text-blue-600 rounded-full p-2">
              <span className="text-lg">📝</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Отправка проблем</h3>
              <p className="text-sm text-gray-600">+1 балл за каждую отправленную проблему</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="bg-orange-100 text-orange-600 rounded-full p-2">
              <span className="text-lg">⭐</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Бонус от админа</h3>
              <p className="text-sm text-gray-600">До +10 баллов за важные находки</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="bg-green-100 text-green-600 rounded-full p-2">
              <span className="text-lg">🏆</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Качество отчетов</h3>
              <p className="text-sm text-gray-600">Подробные описания и фото</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 text-purple-600 rounded-full p-2">
              <span className="text-lg">🎯</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Активность</h3>
              <p className="text-sm text-gray-600">Регулярное участие в системе</p>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка обновления */}
      <div className="mt-6 text-center">
        <button
          onClick={loadData}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          {loading ? '🔄 Обновление...' : '🔄 Обновить данные'}
        </button>
      </div>
    </div>
  );
};

export default HomePage; 