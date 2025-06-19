import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { getLevelInfo } from '../../types/index';
import type { User, SeasonSettings } from '../../types/index';

const LeaderboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [seasonSettings, setSeasonSettings] = useState<SeasonSettings | null>(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [newStartDate, setNewStartDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  useEffect(() => {
    checkAdminStatus();
    loadLeaderboard();
    loadSeasonSettings();
  }, [currentUser]);

  const checkAdminStatus = async () => {
    if (!currentUser) return;
    const adminStatus = await dataService.isAdmin(currentUser.uid, currentUser.email || '');
    setIsAdmin(adminStatus);
  };

  const loadSeasonSettings = async () => {
    try {
      const settings = await dataService.getSeasonSettings();
      setSeasonSettings(settings);
      
      // Устанавливаем значения для формы редактирования
      const startDate = new Date(settings.startDate);
      const endDate = new Date(settings.endDate);
      
      setNewStartDate(startDate.toISOString().split('T')[0]);
      setNewStartTime(startDate.toTimeString().slice(0, 5));
      setNewEndDate(endDate.toISOString().split('T')[0]);
      setNewEndTime(endDate.toTimeString().slice(0, 5));
    } catch (error) {
      console.error('Ошибка загрузки настроек сезона:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const users = await dataService.getLeaderboard();
      setLeaderboard(users);
    } catch (error) {
      console.error('Ошибка загрузки рейтинга:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser || !isAdmin) return;
    
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя из рейтинга?')) {
      try {
        await dataService.deleteUser(userId, currentUser.uid, currentUser.email || '');
        await loadLeaderboard();
      } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        alert('Ошибка удаления пользователя');
      }
    }
  };

  const handleResetSeason = async () => {
    if (!currentUser || !isAdmin) return;
    
    if (window.confirm('Вы уверены, что хотите сбросить текущий сезон? Все данные будут удалены!')) {
      if (window.confirm('Это действие необратимо! Продолжить?')) {
        try {
          await dataService.resetSeason(currentUser.uid, currentUser.email || '');
          await loadLeaderboard();
          await loadSeasonSettings();
          alert('Сезон успешно сброшен');
        } catch (error) {
          console.error('Ошибка сброса сезона:', error);
          alert('Ошибка сброса сезона');
        }
      }
    }
  };

  const handleFinishSeason = async () => {
    if (!currentUser || !isAdmin) return;
    
    if (window.confirm('Вы уверены, что хотите завершить текущий сезон?')) {
      try {
        const { report } = await dataService.finishSeason(currentUser.uid, currentUser.email || '');
        
        // Показываем отчет
        alert(`
Сезон завершен!

📊 Итоги сезона:
- Участников: ${report.totalParticipants}
- Проблем отправлено: ${report.totalProblems}
- Всего баллов: ${report.totalPoints}

🏆 Победители:
${report.winners.map((w: any, i: number) => `${i + 1}. ${w.name} - ${w.points} баллов`).join('\n')}
        `);
        
        await loadSeasonSettings();
      } catch (error) {
        console.error('Ошибка завершения сезона:', error);
        alert('Ошибка завершения сезона');
      }
    }
  };

  const handleUpdateSeasonSettings = async () => {
    if (!currentUser || !isAdmin) return;
    
    try {
      const newSettings: Partial<SeasonSettings> = {
        startDate: new Date(`${newStartDate}T${newStartTime}`).toISOString(),
        endDate: new Date(`${newEndDate}T${newEndTime}`).toISOString()
      };
      
      await dataService.updateSeasonSettings(newSettings, currentUser.uid, currentUser.email || '');
      await loadSeasonSettings();
      setEditingSettings(false);
      alert('Настройки сезона обновлены');
    } catch (error) {
      console.error('Ошибка обновления настроек:', error);
      alert('Ошибка обновления настроек');
    }
  };

  const handleFixUserNames = async () => {
    try {
      await dataService.fixUserNames();
      await loadLeaderboard();
      alert('Имена пользователей обновлены');
    } catch (error) {
      console.error('Ошибка обновления имен:', error);
    }
  };

  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  const activateSeason = async () => {
    if (!currentUser || !isAdmin) return;
    
    try {
      await dataService.updateSeasonSettings({ isActive: true }, currentUser.uid, currentUser.email || '');
      await loadSeasonSettings();
      alert('Сезон активирован');
    } catch (error) {
      console.error('Ошибка активации сезона:', error);
      alert('Ошибка активации сезона');
    }
  };

  const deactivateSeason = async () => {
    if (!currentUser || !isAdmin) return;
    
    try {
      await dataService.updateSeasonSettings({ isActive: false }, currentUser.uid, currentUser.email || '');
      await loadSeasonSettings();
      alert('Сезон деактивирован');
    } catch (error) {
      console.error('Ошибка деактивации сезона:', error);
      alert('Ошибка деактивации сезона');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🏆 Рейтинг участников
        </h1>
        <p className="text-gray-600">
          Лучшие находчики проблем на производстве
        </p>
      </div>

      {/* Админские функции */}
      {isAdmin && currentUser?.email === 'admin@mail.ru' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-yellow-800">🔧 Панель администратора</h3>
          
          {/* Управление сезоном */}
          <div className="space-y-3">
            <h4 className="font-medium text-yellow-700">Управление сезоном:</h4>
            
            {seasonSettings && (
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Начало:</span>
                    <span className="ml-2 font-medium">
                      {new Date(seasonSettings.startDate).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Конец:</span>
                    <span className="ml-2 font-medium">
                      {new Date(seasonSettings.endDate).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Статус:</span>
                    <span className={`ml-2 font-medium ${seasonSettings.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {seasonSettings.isActive ? '✅ Активен' : '❌ Неактивен'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Завершен:</span>
                    <span className={`ml-2 font-medium ${seasonSettings.isFinished ? 'text-red-600' : 'text-green-600'}`}>
                      {seasonSettings.isFinished ? 'Да' : 'Нет'}
                    </span>
                  </div>
                </div>

                {editingSettings ? (
                  <div className="space-y-3 border-t pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Дата начала:
                        </label>
                        <input
                          type="date"
                          value={newStartDate}
                          onChange={(e) => setNewStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Время начала:
                        </label>
                        <input
                          type="time"
                          value={newStartTime}
                          onChange={(e) => setNewStartTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Дата окончания:
                        </label>
                        <input
                          type="date"
                          value={newEndDate}
                          onChange={(e) => setNewEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Время окончания:
                        </label>
                        <input
                          type="time"
                          value={newEndTime}
                          onChange={(e) => setNewEndTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateSeasonSettings}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                      >
                        💾 Сохранить
                      </button>
                      <button
                        onClick={() => {
                          setEditingSettings(false);
                          loadSeasonSettings();
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                      >
                        ❌ Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 border-t pt-3">
                    <button
                      onClick={() => setEditingSettings(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      ✏️ Изменить даты
                    </button>
                    {seasonSettings.isActive ? (
                      <button
                        onClick={deactivateSeason}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        ⏸️ Деактивировать
                      </button>
                    ) : (
                      <button
                        onClick={activateSeason}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        ▶️ Активировать
                      </button>
                    )}
                    {!seasonSettings.isFinished && (
                      <button
                        onClick={handleFinishSeason}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        🏁 Завершить сезон
                      </button>
                    )}
                    <button
                      onClick={handleResetSeason}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      🔄 Сбросить сезон
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Другие админские функции */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleFixUserNames}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              🔧 Исправить имена
            </button>
            <button
              onClick={() => dataService.exportData()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              📥 Экспорт данных
            </button>
          </div>
        </div>
      )}

      {/* Топ-3 */}
      {leaderboard.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map((user, index) => {
            const position = index + 1;
            const levelInfo = getLevelInfo(user.totalPoints || 0);
            const medal = getMedalEmoji(position);
            
            return (
              <div
                key={user.id}
                className={`bg-white rounded-lg shadow-lg border-2 p-6 text-center transform transition-transform hover:scale-105 ${
                  position === 1 ? 'border-yellow-400' :
                  position === 2 ? 'border-gray-400' :
                  'border-orange-400'
                }`}
              >
                <div className="text-5xl mb-3">{medal}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {user.fullName}
                </h3>
                <div className="text-3xl font-bold mb-2" style={{ color: levelInfo.color }}>
                  {user.totalPoints || 0} {user.totalPoints === 1 ? 'балл' : user.totalPoints && user.totalPoints < 5 ? 'балла' : 'баллов'}
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  {user.totalProblems || 0} {user.totalProblems === 1 ? 'проблема' : user.totalProblems && user.totalProblems < 5 ? 'проблемы' : 'проблем'}
                </div>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: `${levelInfo.color}20`, color: levelInfo.color }}>
                  <span className="mr-1">{levelInfo.emoji}</span>
                  {levelInfo.name}
                </div>
                {isAdmin && currentUser?.email === 'admin@mail.ru' && (
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="mt-3 text-red-600 hover:text-red-800 text-sm"
                  >
                    Удалить
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Полный рейтинг */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Полный рейтинг
          </h2>
        </div>
        
        {leaderboard.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Пока нет участников с баллами
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Место
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Участник
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Уровень
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Баллы
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Проблем
                  </th>
                  {isAdmin && currentUser?.email === 'admin@mail.ru' && (
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaderboard.map((user, index) => {
                  const position = index + 1;
                  const levelInfo = getLevelInfo(user.totalPoints || 0);
                  const medal = getMedalEmoji(position);
                  
                  return (
                    <tr key={user.id} className={currentUser?.uid === user.id ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg font-medium text-gray-900">
                            {medal || `#${position}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.fullName}
                          {currentUser?.uid === user.id && (
                            <span className="ml-2 text-xs text-blue-600">(Вы)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${levelInfo.color}20`, color: levelInfo.color }}
                        >
                          <span className="mr-1">{levelInfo.emoji}</span>
                          {levelInfo.name}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-semibold" style={{ color: levelInfo.color }}>
                          {user.totalPoints || 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {user.totalProblems || 0}
                      </td>
                      {isAdmin && currentUser?.email === 'admin@mail.ru' && (
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Удалить
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Кнопка экспорта для всех */}
      <div className="flex justify-center">
        <button
          onClick={() => dataService.exportData()}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
        >
          📥 Скачать данные
        </button>
      </div>
    </div>
  );
};

export default LeaderboardPage; 