import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { localDataService, type LocalUser, type SeasonSettings } from '../../services/localDataService';

interface LeaderboardEntry extends LocalUser {
  rank: number;
}

const LeaderboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [seasonSettings, setSeasonSettings] = useState<SeasonSettings | null>(null);

  useEffect(() => {
    loadLeaderboard();
    checkAdminStatus();
    loadSeasonSettings();
  }, [currentUser]);

  const checkAdminStatus = async () => {
    if (currentUser && currentUser.email === 'admin@mail.ru') {
      const adminStatus = await localDataService.isAdmin(currentUser.uid, currentUser.email || '');
      setIsAdmin(adminStatus);
    } else {
      setIsAdmin(false);
    }
  };

  const loadSeasonSettings = async () => {
    try {
      const settings = await localDataService.getSeasonSettings();
      setSeasonSettings(settings);
    } catch (error) {
      console.error('Ошибка загрузки настроек сезона:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Загружаем реальные данные из локальной базы
      const users = await localDataService.getLeaderboard();
      setLeaderboard(users as LeaderboardEntry[]);
      
      console.log('✅ Загружен рейтинг:', users.length, 'пользователей');

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
        await localDataService.deleteUser(userId, currentUser.uid, currentUser.email || '');
        alert(`✅ Пользователь "${userName}" удален`);
        await loadLeaderboard();
        
        // Уведомляем другие компоненты
        window.dispatchEvent(new CustomEvent('userStatsUpdated'));
      } catch (error: any) {
        alert(`❌ Ошибка удаления: ${error.message}`);
      }
    }
  };

  const handleResetSeason = async () => {
    if (!currentUser || !isAdmin) {
      alert('❌ Доступ запрещен');
      return;
    }

    if (window.confirm('Вы уверены, что хотите сбросить сезон? Все баллы и проблемы будут удалены!')) {
      try {
        await localDataService.resetSeason(currentUser.uid, currentUser.email || '');
        alert('✅ Сезон сброшен!');
        await loadLeaderboard();
        await loadSeasonSettings();
        
        // Уведомляем другие компоненты
        window.dispatchEvent(new CustomEvent('userStatsUpdated'));
      } catch (error: any) {
        alert(`❌ Ошибка сброса: ${error.message}`);
      }
    }
  };

  const handleFinishSeason = async () => {
    if (!currentUser || !isAdmin) {
      alert('❌ Доступ запрещен');
      return;
    }

    if (window.confirm('Завершить сезон? Это покажет финальные результаты всем пользователям!')) {
      try {
        const { report } = await localDataService.finishSeason(currentUser.uid, currentUser.email || '');
        alert(`🏆 Сезон "${report.seasonName}" завершен!\n\nПобедители:\n${report.winners.slice(0, 3).map((w: any) => `${w.rank}. ${w.name} - ${w.points} баллов`).join('\n')}`);
        
        await loadLeaderboard();
        await loadSeasonSettings();
        
        // Уведомляем другие компоненты
        window.dispatchEvent(new CustomEvent('userStatsUpdated'));
      } catch (error: any) {
        alert(`❌ Ошибка завершения: ${error.message}`);
      }
    }
  };

  const handleUpdateSeason = async (newSettings: Partial<SeasonSettings>) => {
    if (!currentUser || !isAdmin) {
      alert('❌ Доступ запрещен');
      return;
    }

    try {
      await localDataService.updateSeasonSettings(newSettings, currentUser.uid, currentUser.email || '');
      alert('✅ Настройки сезона обновлены!');
      await loadSeasonSettings();
    } catch (error: any) {
      alert(`❌ Ошибка обновления: ${error.message}`);
    }
  };

  const fixUserNames = async () => {
    try {
      setLoading(true);
      await localDataService.fixUserNames();
      await loadLeaderboard(); // Перезагружаем рейтинг
      alert('✅ Имена пользователей исправлены!');
    } catch (error) {
      console.error('❌ Ошибка исправления имен:', error);
      alert('❌ Ошибка исправления имен');
    } finally {
      setLoading(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleActivateSeason = async () => {
    if (!currentUser || !isAdmin) {
      alert('❌ Доступ запрещен');
      return;
    }

    if (window.confirm('Активировать игру? Участники смогут отправлять проблемы и получать баллы!')) {
      try {
        await localDataService.updateSeasonSettings({ isActive: true }, currentUser.uid, currentUser.email || '');
        alert('🚀 Игра активирована! Участники могут начинать отправлять проблемы!');
        await loadSeasonSettings();
        
        // Уведомляем другие компоненты
        window.dispatchEvent(new CustomEvent('userStatsUpdated'));
      } catch (error: any) {
        alert(`❌ Ошибка активации: ${error.message}`);
      }
    }
  };

  const handleDeactivateSeason = async () => {
    if (!currentUser || !isAdmin) {
      alert('❌ Доступ запрещен');
      return;
    }

    if (window.confirm('Приостановить игру? Участники не смогут отправлять новые проблемы!')) {
      try {
        await localDataService.updateSeasonSettings({ isActive: false }, currentUser.uid, currentUser.email || '');
        alert('⏸️ Игра приостановлена!');
        await loadSeasonSettings();
        
        // Уведомляем другие компоненты
        window.dispatchEvent(new CustomEvent('userStatsUpdated'));
      } catch (error: any) {
        alert(`❌ Ошибка приостановки: ${error.message}`);
      }
    }
  };

  const handleConfigureSeason = async () => {
    if (!currentUser || !isAdmin) {
      alert('❌ Доступ запрещен');
      return;
    }

    // Быстрые варианты
    const quickOptions = window.confirm(
      '🚀 Быстрая настройка?\n\n' +
      'ДА - выбрать из готовых вариантов\n' +
      'НЕТ - ввести даты вручную'
    );

    let startDateTime: string;
    let endDateTime: string;

    if (quickOptions) {
      // Быстрые варианты
      const option = prompt(
        '⚡ Выберите период игры:\n\n' +
        '1 - 10 минут\n' +
        '2 - 1 час\n' +
        '3 - 1 день\n' +
        '4 - 1 неделя\n' +
        '5 - 1 месяц\n\n' +
        'Введите номер (1-5):'
      );

      const now = new Date();
      let endTime: Date;

      switch (option) {
        case '1':
          endTime = new Date(now.getTime() + 10 * 60 * 1000); // +10 минут
          break;
        case '2':
          endTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 час
          break;
        case '3':
          endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 день
          break;
        case '4':
          endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +1 неделя
          break;
        case '5':
          endTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +1 месяц
          break;
        default:
          alert('❌ Неверный выбор');
          return;
      }

      startDateTime = now.toISOString();
      endDateTime = endTime.toISOString();
    } else {
      // Ручной ввод
      const startDateInput = prompt(
        '📅 Введите дату НАЧАЛА игры\n\n' +
        'Формат: ГГГГ-ММ-ДД\n' +
        'Пример: 2024-06-20'
      );

      if (!startDateInput) return;

      const startTimeInput = prompt(
        '⏰ Введите время НАЧАЛА игры\n\n' +
        'Формат: ЧЧ:ММ\n' +
        'Пример: 09:00'
      );

      if (!startTimeInput) return;

      const endDateInput = prompt(
        '📅 Введите дату ОКОНЧАНИЯ игры\n\n' +
        'Формат: ГГГГ-ММ-ДД\n' +
        'Пример: 2024-06-21'
      );

      if (!endDateInput) return;

      const endTimeInput = prompt(
        '⏰ Введите время ОКОНЧАНИЯ игры\n\n' +
        'Формат: ЧЧ:ММ\n' +
        'Пример: 18:00'
      );

      if (!endTimeInput) return;

      try {
        startDateTime = new Date(`${startDateInput}T${startTimeInput}:00`).toISOString();
        endDateTime = new Date(`${endDateInput}T${endTimeInput}:00`).toISOString();

        // Проверяем что конец после начала
        if (new Date(endDateTime) <= new Date(startDateTime)) {
          alert('❌ Дата окончания должна быть позже даты начала');
          return;
        }
      } catch (error) {
        alert('❌ Неверный формат даты или времени');
        return;
      }
    }

    // Название сезона
    const seasonName = prompt(
      '🎮 Введите название игры:\n\n' +
      'Пример: Весенний конкурс 2024',
      seasonSettings?.currentSeason || 'Конкурс ПНР'
    );

    if (!seasonName) return;

    // Активность
    const isActive = window.confirm(
      '🟢 Сделать игру активной?\n\n' +
      'ДА - участники смогут отправлять проблемы\n' +
      'НЕТ - игра будет неактивна'
    );

    // Сохраняем настройки
    try {
      await localDataService.updateSeasonSettings({
        currentSeason: seasonName,
        seasonStartDate: startDateTime,
        seasonEndDate: endDateTime,
        isActive: isActive
      }, currentUser.uid, currentUser.email || '');

      const startDate = new Date(startDateTime);
      const endDate = new Date(endDateTime);

      alert(
        '✅ Настройки сохранены!\n\n' +
        `🎮 Игра: ${seasonName}\n` +
        `🟢 Начало: ${startDate.toLocaleDateString('ru-RU')} в ${startDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}\n` +
        `🏁 Окончание: ${endDate.toLocaleDateString('ru-RU')} в ${endDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}\n` +
        `📊 Статус: ${isActive ? '🟢 Активна' : '🔴 Неактивна'}`
      );

      await loadSeasonSettings();
      
      // Уведомляем другие компоненты
      window.dispatchEvent(new CustomEvent('userStatsUpdated'));
    } catch (error: any) {
      alert(`❌ Ошибка сохранения: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка рейтинга...</p>
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
          Реальный рейтинг на основе отправленных проблем и полученных баллов
        </p>
      </div>

      {/* Информация о системе */}
      <div className="mb-6 sm:mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">💾</span>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800">Реальные данные</h3>
            <p className="text-sm text-blue-600">
              Рейтинг формируется автоматически на основе реальных действий пользователей.<br />
              Данные сохраняются в JSON файлы: /Users/mike/Desktop/quiz/problem-tracker-data/
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

      {/* Админская панель сезона */}
      {isAdmin && seasonSettings && (
        <div className="mb-6 sm:mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-3">⚙️ Управление игрой (только admin@mail.ru)</h3>
          
          {/* Текущий статус */}
          <div className="mb-4 p-3 bg-white rounded-lg border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>🎮 Название:</strong> {seasonSettings.currentSeason}</p>
                <p><strong>📊 Статус:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    seasonSettings.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {seasonSettings.isActive ? '🟢 Активна' : '🔴 Неактивна'}
                  </span>
                </p>
              </div>
              <div>
                <p><strong>📅 Период проведения:</strong></p>
                <p className="text-xs text-gray-600">
                  🟢 Начало: {new Date(seasonSettings.seasonStartDate).toLocaleDateString('ru-RU')} в {new Date(seasonSettings.seasonStartDate).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
                  <br />
                  🏁 Окончание: {new Date(seasonSettings.seasonEndDate).toLocaleDateString('ru-RU')} в {new Date(seasonSettings.seasonEndDate).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
                </p>
              </div>
            </div>
            
            {/* Пояснение текущего состояния */}
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
              {seasonSettings.isActive ? (
                <p>✅ <strong>Игра активна:</strong> участники могут отправлять проблемы и получать баллы. Используйте кнопку "⏸️ Приостановить" для временной остановки.</p>
              ) : (
                <p>⏸️ <strong>Игра приостановлена:</strong> участники не могут отправлять новые проблемы. Используйте кнопку "🚀 Активировать" для возобновления.</p>
              )}
            </div>
          </div>

          {/* Кнопки управления */}
          <div className="space-y-3">
            {/* Основные действия */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleConfigureSeason}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                📅 Настроить период игры
              </button>
              
              {seasonSettings.isActive ? (
                <button
                  onClick={handleDeactivateSeason}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  ⏸️ Приостановить игру
                </button>
              ) : (
                <button
                  onClick={handleActivateSeason}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  🚀 Активировать игру
                </button>
              )}
            </div>

            {/* Финальные действия */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-yellow-300">
              <button
                onClick={handleFinishSeason}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                🏆 Завершить игру с отчетом
              </button>
              <button
                onClick={handleResetSeason}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                🔄 Сбросить все данные
              </button>
            </div>
          </div>

          {/* Подсказки */}
          <div className="mt-3 text-xs text-yellow-700 space-y-1">
            <p>💡 <strong>Настроить период:</strong> установите даты и время проведения игры (можете выбрать любой период: 10 минут, час, день, месяц)</p>
            <p>🚀 <strong>Активировать:</strong> участники смогут отправлять проблемы и получать баллы</p>
            <p>⏸️ <strong>Приостановить:</strong> временно остановить игру без потери данных</p>
            <p>🏆 <strong>Завершить:</strong> покажет финальные результаты всем участникам</p>
            <p>🔄 <strong>Сбросить:</strong> удалит все данные и начнет игру заново</p>
          </div>
        </div>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600">
            {leaderboard.length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">
            Участников
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-green-600">
            {leaderboard.reduce((sum, user) => sum + user.totalPoints, 0)}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">
            Всего баллов
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center col-span-2 sm:col-span-1">
          <div className="text-2xl sm:text-3xl font-bold text-purple-600">
            {leaderboard.reduce((sum, user) => sum + user.totalProblems, 0)}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">
            Проблем найдено
          </div>
        </div>
      </div>

      {/* Топ-3 - особое отображение */}
      {leaderboard.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 text-center">
            🏆 Топ-3 лидера
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {leaderboard.slice(0, 3).map((user) => {
              const levelInfo = getLevelInfo(user.totalPoints);
              return (
                <div
                  key={user.id}
                  className={`bg-white rounded-lg shadow-sm p-4 sm:p-6 text-center border-2 ${getRankColor(user.rank)}`}
                >
                  <div className="text-3xl sm:text-4xl mb-2">
                    {getRankEmoji(user.rank)}
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                    {user.fullName}
                  </div>
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <span className="text-lg sm:text-xl">{levelInfo.emoji}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {levelInfo.name}
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
                    {user.totalPoints}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    {user.totalProblems} проблем
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    С {formatDate(user.joinedAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Полный рейтинг */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            📊 Полный рейтинг
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {leaderboard.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🤷‍♂️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Пока нет участников
              </h3>
              <p className="text-gray-600 mb-4">
                Станьте первым! Отправьте проблему и получите баллы.
              </p>
              <p className="text-sm text-gray-500">
                Данные будут отображаться автоматически после регистрации и отправки первой проблемы.
              </p>
            </div>
          ) : (
            leaderboard.map((user) => {
              const levelInfo = getLevelInfo(user.totalPoints);
              return (
                <div
                  key={user.id}
                  className="p-3 sm:p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10">
                      <span className="text-lg sm:text-xl">
                        {getRankEmoji(user.rank)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                      <span className="text-sm sm:text-base font-medium text-gray-900">
                        #{user.rank}
                      </span>
                      <span className="text-lg sm:text-xl">{levelInfo.emoji}</span>
                      <div className="flex-1">
                        <div className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                          {user.fullName}
                          {user.isAdmin && (
                            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                              👑 Админ
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          {levelInfo.name} • {user.totalProblems} проблем • с {formatDate(user.joinedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-lg sm:text-xl font-bold text-blue-600">
                        {user.totalPoints}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        баллов
                      </div>
                    </div>
                    
                    {/* Админские кнопки */}
                    {isAdmin && !user.isAdmin && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.fullName)}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium py-1 px-2 rounded transition-colors ml-2"
                        title="Удалить пользователя"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Информация о системе баллов */}
      <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-green-50 rounded-lg">
        <h3 className="text-base sm:text-lg font-semibold text-green-900 mb-2">
          💡 Как работает система баллов?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm text-green-800">
          <div>
            <p>• За каждую проблему: +1 балл автоматически</p>
            <p>• Бонус от админа: до +10 баллов за важные находки</p>
            <p>• Рейтинг обновляется в реальном времени</p>
          </div>
          <div>
            <p>• 🏁 Новичок: 1-4 балла</p>
            <p>• 🛠️ Боец: 5-9 баллов</p>
            <p>• 🧠 Мастер: 10+ баллов</p>
          </div>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button
          onClick={loadLeaderboard}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          🔄 Обновить рейтинг
        </button>
        {isAdmin ? (
          <>
            <button
              onClick={fixUserNames}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              ✏️ Исправить имена
            </button>
            <button
              onClick={() => localDataService.exportData()}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              📦 Экспорт данных
            </button>
          </>
        ) : (
          <button
            onClick={() => localDataService.exportData()}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            📦 Экспорт данных
          </button>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage; 