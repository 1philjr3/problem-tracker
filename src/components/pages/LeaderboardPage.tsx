import React, { useState, useEffect } from 'react';
import { TrophyIcon, FireIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { cloudDataService } from '../../services/cloudDataService';
import type { LeaderboardEntry } from '../../types';

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await cloudDataService.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Ошибка загрузки рейтинга:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = (level: string) => {
    switch (level) {
      case 'master':
        return { name: 'Мастер', icon: '🧠', color: 'text-purple-600' };
      case 'fighter':
        return { name: 'Боец', icon: '🛠️', color: 'text-blue-600' };
      default:
        return { name: 'Новичок', icon: '🏁', color: 'text-gray-600' };
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <TrophyIcon className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <FireIcon className="h-6 w-6 text-gray-400" />;
      case 3:
        return <SparklesIcon className="h-6 w-6 text-orange-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">🏆 Рейтинг участников</h1>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Пока нет участников с баллами</p>
        </div>
      ) : (
        <>
          {/* Топ-3 участников */}
          {leaderboard.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {leaderboard.slice(0, 3).map((entry) => {
                const levelInfo = getLevelInfo(entry.level);
                return (
                  <div
                    key={entry.userId}
                    className={`relative bg-white rounded-lg shadow-md p-6 ${
                      entry.position === 1 ? 'ring-2 ring-yellow-400' : ''
                    }`}
                  >
                    <div className="absolute top-2 right-2">
                      {getMedalIcon(entry.position)}
                    </div>
                    <div className="text-center">
                      <div className="text-4xl mb-2">{levelInfo.icon}</div>
                      <h3 className="font-semibold text-lg">{entry.fullName}</h3>
                      <p className={`text-sm ${levelInfo.color}`}>{levelInfo.name}</p>
                      <div className="mt-4">
                        <p className="text-2xl font-bold text-gray-900">{entry.points}</p>
                        <p className="text-sm text-gray-500">баллов</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {entry.answersCount} {entry.answersCount === 1 ? 'проблема' : 'проблем'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Полная таблица */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Место
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Участник
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Уровень
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Проблем
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Баллы
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((entry) => {
                  const levelInfo = getLevelInfo(entry.level);
                  return (
                    <tr key={entry.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {entry.position}
                          </span>
                          <span className="ml-2">{getMedalIcon(entry.position)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{entry.fullName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">{levelInfo.icon}</span>
                          <span className={`text-sm ${levelInfo.color}`}>{levelInfo.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">{entry.answersCount}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-semibold text-gray-900">{entry.points}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
} 