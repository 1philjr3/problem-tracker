import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SeasonTimer } from '../common/SeasonTimer';
import { localDataService, type LocalUser } from '../../services/localDataService';

// Локальная функция для определения уровня
const getLevelInfo = (points: number) => {
  if (points >= 10) {
    return { emoji: '🧠', title: 'Мастер', color: 'text-purple-600' };
  }
  if (points >= 5) {
    return { emoji: '🛠️', title: 'Боец', color: 'text-blue-600' };
  }
  return { emoji: '🏁', title: 'Новичок', color: 'text-green-600' };
};

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userStats, setUserStats] = useState<{
    totalPoints: number;
    totalProblems: number;
    rank: number;
    level: ReturnType<typeof getLevelInfo>;
    fullName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [seasonReport, setSeasonReport] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadUserStats();
    } else {
      setLoading(false);
    }
    loadSeasonReport();
  }, [currentUser]);

  const loadUserStats = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Получаем правильное ФИО пользователя
      const displayName = await localDataService.getUserDisplayName(
        currentUser.uid, 
        currentUser.email || ''
      );

      // Сначала убеждаемся что пользователь есть в локальной базе
      await localDataService.saveUser({
        id: currentUser.uid,
        email: currentUser.email || '',
        fullName: displayName,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      });

      // Получаем данные пользователя
      const userData = await localDataService.getUser(currentUser.uid);
      
      // Получаем рейтинг для определения места
      const leaderboard = await localDataService.getLeaderboard();
      const userRank = leaderboard.findIndex(user => user.id === currentUser.uid) + 1;

      if (userData) {
        const levelInfo = getLevelInfo(userData.totalPoints);
        setUserStats({
          totalPoints: userData.totalPoints,
          totalProblems: userData.totalProblems,
          rank: userRank || leaderboard.length + 1,
          level: levelInfo,
          fullName: userData.fullName
        });
      } else {
        // Если пользователя нет, показываем начальные данные
        const levelInfo = getLevelInfo(0);
        setUserStats({
          totalPoints: 0,
          totalProblems: 0,
          rank: leaderboard.length + 1,
          level: levelInfo,
          fullName: displayName
        });
      }

      console.log('✅ Статистика пользователя загружена');

    } catch (error) {
      console.error('❌ Ошибка загрузки статистики:', error);
      // Показываем начальные данные в случае ошибки
      const levelInfo = getLevelInfo(0);
      setUserStats({
        totalPoints: 0,
        totalProblems: 0,
        rank: 1,
        level: levelInfo,
        fullName: currentUser.email?.split('@')[0] || 'Пользователь'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSeasonReport = async () => {
    try {
      const report = await localDataService.getSeasonReport();
      setSeasonReport(report);
    } catch (error) {
      console.error('Ошибка загрузки отчета сезона:', error);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
      {/* Приветствие */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="text-4xl sm:text-6xl mb-4">👋</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Добро пожаловать в систему ПНР!
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
          Система геймификации для сообщения о проблемах на производстве. 
          Находите проблемы, получайте баллы, поднимайтесь в рейтинге!
        </p>
        
        {/* Текущее время */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg inline-block">
          <div className="text-xs sm:text-sm text-blue-600 font-medium">
            {formatDate(currentTime)}
          </div>
          <div className="text-lg sm:text-2xl font-bold text-blue-800">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>

      {/* Статистика пользователя */}
      {currentUser && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 text-center">
            📊 Ваша статистика
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Загрузка статистики...</p>
            </div>
          ) : userStats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {userStats.totalPoints}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                  Баллов
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">
                  {userStats.totalProblems}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                  Проблем
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                  #{userStats.rank}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                  Место
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 text-center">
                <div className="text-2xl sm:text-3xl">
                  {userStats.level.emoji}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                  {userStats.level.title}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Ошибка загрузки статистики</p>
              <button 
                onClick={loadUserStats}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Попробовать снова
              </button>
            </div>
          )}

          {/* Информация о профиле */}
          {currentUser && userStats && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">👤</span>
                <div>
                  <h3 className="font-semibold text-green-800">Ваш профиль</h3>
                  <p className="text-sm text-green-600">
                    <strong>Имя:</strong> {userStats ? userStats.fullName : (currentUser.displayName || currentUser.email || 'Пользователь')}<br />
                    <strong>Email:</strong> {currentUser.email}<br />
                    <strong>Уровень:</strong> {userStats.level.emoji} {userStats.level.title}<br />
                    <strong>Данные сохраняются в:</strong> /Users/mike/Desktop/quiz/problem-tracker-data/
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Кнопка обновления статистики */}
      {currentUser && (
        <div className="mb-6 sm:mb-8 text-center">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={loadUserStats}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🔄 Обновить статистику
            </button>
            <button
              onClick={() => localDataService.fixUserNames()}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              ✏️ Исправить имена
            </button>
          </div>
        </div>
      )}

      {/* Таймер сезона */}
      <div className="mb-6 sm:mb-8">
        <SeasonTimer />
      </div>

      {/* Отчет о завершенном сезоне */}
      {seasonReport && (
        <div className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Итоги игры "{seasonReport.seasonName}"
              </h2>
              <p className="text-gray-600">
                {new Date(seasonReport.startDate).toLocaleDateString('ru-RU')} - {new Date(seasonReport.endDate).toLocaleDateString('ru-RU')}
              </p>
            </div>

            {/* Общая статистика */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{seasonReport.totalParticipants}</div>
                <div className="text-sm text-gray-600">Участников</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-green-600">{seasonReport.totalProblems}</div>
                <div className="text-sm text-gray-600">Проблем найдено</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{seasonReport.totalPoints}</div>
                <div className="text-sm text-gray-600">Баллов начислено</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(seasonReport.totalProblems / seasonReport.totalParticipants * 10) / 10}
                </div>
                <div className="text-sm text-gray-600">Среднее на участника</div>
              </div>
            </div>

            {/* Топ-3 победителя */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                🥇 Топ-3 победителя
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {seasonReport.winners.slice(0, 3).map((winner: any, index: number) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const colors = ['bg-yellow-100 border-yellow-300', 'bg-gray-100 border-gray-300', 'bg-orange-100 border-orange-300'];
                  
                  return (
                    <div key={winner.rank} className={`bg-white rounded-lg p-4 text-center border-2 ${colors[index]} shadow-sm`}>
                      <div className="text-4xl mb-2">{medals[index]}</div>
                      <div className="font-bold text-gray-900">{winner.name}</div>
                      <div className="text-2xl font-bold text-blue-600 my-1">{winner.points}</div>
                      <div className="text-sm text-gray-600">{winner.problems} проблем</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Полный список победителей */}
            {seasonReport.winners.length > 3 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">📊 Полный рейтинг:</h4>
                <div className="space-y-2">
                  {seasonReport.winners.slice(3, 10).map((winner: any) => (
                    <div key={winner.rank} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-600">#{winner.rank}</span>
                        <span className="text-gray-900">{winner.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{winner.points}</div>
                        <div className="text-xs text-gray-500">{winner.problems} проблем</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Поздравление */}
            <div className="mt-6 text-center">
              <p className="text-lg text-gray-700 mb-2">
                🎉 Поздравляем всех участников!
              </p>
              <p className="text-sm text-gray-600">
                Благодаря вашей активности производство стало безопаснее и эффективнее
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Информационные карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Как работает система */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">🎯</span>
            Как работает система?
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">✓</span>
              Находите проблемы на производстве
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">✓</span>
              Отправляйте через форму с описанием и фото
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">✓</span>
              Получайте +1 балл за каждую проблему автоматически
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">✓</span>
              Поднимайтесь в рейтинге и получайте уровни
            </li>
          </ul>
        </div>

        {/* Хранение файлов */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">💾</span>
            Где сохраняются данные?
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p className="flex items-start">
              <span className="text-blue-500 mr-2 mt-1">📁</span>
              Все данные сохраняются в <strong>JSON файлы</strong> на ваш компьютер
            </p>
            <p className="flex items-start">
              <span className="text-blue-500 mr-2 mt-1">🖼️</span>
              Изображения сохраняются в папку <strong>uploads/</strong>
            </p>
            <p className="flex items-start">
              <span className="text-blue-500 mr-2 mt-1">⚡</span>
              Быстрая работа с локальными файлами
            </p>
            <p className="flex items-start">
              <span className="text-blue-500 mr-2 mt-1">📱</span>
              Полная совместимость с мобильными устройствами
            </p>
          </div>
        </div>
      </div>

      {/* Категории проблем */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          📋 Категории проблем
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-3">
          {[
            { emoji: '🔧', name: 'ТО', color: 'bg-blue-50 text-blue-700' },
            { emoji: '🧪', name: 'Испытания', color: 'bg-green-50 text-green-700' },
            { emoji: '📋', name: 'Аудит', color: 'bg-purple-50 text-purple-700' },
            { emoji: '⚠️', name: 'Безопасность', color: 'bg-red-50 text-red-700' },
            { emoji: '✅', name: 'Качество', color: 'bg-yellow-50 text-yellow-700' },
            { emoji: '⚙️', name: 'Оборудование', color: 'bg-orange-50 text-orange-700' },
            { emoji: '🔄', name: 'Процессы', color: 'bg-pink-50 text-pink-700' },
            { emoji: '📝', name: 'Другое', color: 'bg-gray-50 text-gray-700' },
          ].map((category, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg text-center ${category.color} transition-transform hover:scale-105`}
            >
              <div className="text-2xl mb-1">{category.emoji}</div>
              <div className="text-xs font-medium">{category.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Уровни и достижения */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          🏆 Система уровней
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">🏁</div>
            <div className="font-semibold text-gray-800">Новичок</div>
            <div className="text-sm text-gray-600">1-4 балла</div>
            <div className="text-xs text-gray-500 mt-2">
              Начинающий участник
            </div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl mb-2">🛠️</div>
            <div className="font-semibold text-blue-800">Боец</div>
            <div className="text-sm text-blue-600">5-9 баллов</div>
            <div className="text-xs text-blue-500 mt-2">
              Активный участник
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl mb-2">🧠</div>
            <div className="font-semibold text-purple-800">Мастер</div>
            <div className="text-sm text-purple-600">10+ баллов</div>
            <div className="text-xs text-purple-500 mt-2">
              Эксперт по качеству
            </div>
          </div>
        </div>
      </div>

      {/* Призыв к действию */}
      {currentUser && (
        <div className="mt-6 sm:mt-8 text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Готовы найти проблему?
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Каждая найденная проблема делает производство лучше и безопаснее!
            </p>
            <div className="text-sm text-gray-500">
              💾 Все данные и изображения сохраняются в JSON файлы на ваш компьютер
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage; 