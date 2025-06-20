import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cloudDataService } from '../../services/cloudDataService';
import { getLevelInfo } from '../../types';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export function Header() {
  const { currentUser, logout } = useAuth();
  const [userStats, setUserStats] = useState<{
    fullName: string;
    points: number;
    problems: number;
    level: 'novice' | 'fighter' | 'master';
  }>({
    fullName: '',
    points: 0,
    problems: 0,
    level: 'novice'
  });

  useEffect(() => {
    if (currentUser) {
      loadUserStats();
    }
  }, [currentUser]);

  useEffect(() => {
    // Слушаем событие обновления статистики
    const handleUpdate = () => {
      if (currentUser) {
        loadUserStats();
      }
    };

    window.addEventListener('userStatsUpdated', handleUpdate);
    return () => window.removeEventListener('userStatsUpdated', handleUpdate);
  }, [currentUser]);

  const loadUserStats = async () => {
    if (!currentUser) return;

    try {
      // Получаем имя пользователя
      const displayName = await cloudDataService.getUserDisplayName(
        currentUser.uid,
        currentUser.email || ''
      );

      // Получаем статистику из рейтинга
      const leaderboard = await cloudDataService.getLeaderboard();
      const userEntry = leaderboard.find(entry => entry.userId === currentUser.uid);

      if (userEntry) {
        setUserStats({
          fullName: displayName,
          points: userEntry.points,
          problems: userEntry.answersCount,
          level: userEntry.level
        });
      } else {
        // Если пользователя нет в рейтинге, показываем начальные данные
        setUserStats({
          fullName: displayName,
          points: 0,
          problems: 0,
          level: 'novice'
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
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

  const levelInfo = getLevelInfo(userStats.level);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              🏭 Система ПНР
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Статистика пользователя */}
            <div className="flex items-center space-x-3 text-sm">
              <span className="text-gray-700 font-medium">
                {userStats.fullName || currentUser.email}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{levelInfo.icon}</span>
                <span className={`font-medium ${levelInfo.color}`}>
                  {levelInfo.name}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-bold text-blue-600">{userStats.points}</span>
                <span className="text-gray-500">баллов</span>
              </div>
            </div>

            {/* Кнопка обновления */}
            <button
              onClick={loadUserStats}
              className="text-gray-500 hover:text-gray-700"
              title="Обновить статистику"
            >
              🔄
            </button>

            {/* Кнопка выхода */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 