import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import type { SeasonSettings } from '../../types/index';

export const SeasonTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [seasonSettings, setSeasonSettings] = useState<SeasonSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSeasonSettings();
  }, []);

  useEffect(() => {
    if (!seasonSettings) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(seasonSettings.endDate).getTime();
      const difference = end - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [seasonSettings]);

  const loadSeasonSettings = async () => {
    try {
      const settings = await dataService.getSeasonSettings();
      setSeasonSettings(settings);
    } catch (error) {
      console.error('Ошибка загрузки настроек сезона:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!seasonSettings || !seasonSettings.isActive) {
    return (
      <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-2xl mb-2">⏸️</div>
          <h3 className="text-lg font-semibold text-gray-700">Сезон не активен</h3>
          <p className="text-sm text-gray-600 mt-1">
            Ожидайте начала нового сезона
          </p>
        </div>
      </div>
    );
  }

  if (seasonSettings.isFinished) {
    return (
      <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-6">
        <div className="text-center">
          <div className="text-2xl mb-2">🏁</div>
          <h3 className="text-lg font-semibold text-green-700">Сезон завершен!</h3>
          <p className="text-sm text-green-600 mt-1">
            Спасибо за участие! Ожидайте результатов.
          </p>
        </div>
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-6">
        <div className="text-center">
          <div className="text-2xl mb-2">⏰</div>
          <h3 className="text-lg font-semibold text-red-700">Время истекло!</h3>
          <p className="text-sm text-red-600 mt-1">
            Сезон завершен, ожидайте подведения итогов
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⏱️ До конца сезона осталось:
        </h3>
        
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-blue-50 rounded-lg p-2 sm:p-3">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {timeLeft.days}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              {timeLeft.days === 1 ? 'день' : 
               timeLeft.days >= 2 && timeLeft.days <= 4 ? 'дня' : 'дней'}
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-2 sm:p-3">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {timeLeft.hours}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              {timeLeft.hours === 1 ? 'час' : 
               timeLeft.hours >= 2 && timeLeft.hours <= 4 ? 'часа' : 'часов'}
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-2 sm:p-3">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {timeLeft.minutes}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              {timeLeft.minutes === 1 ? 'минута' : 
               timeLeft.minutes >= 2 && timeLeft.minutes <= 4 ? 'минуты' : 'минут'}
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-2 sm:p-3">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              {timeLeft.seconds}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              {timeLeft.seconds === 1 ? 'секунда' : 
               timeLeft.seconds >= 2 && timeLeft.seconds <= 4 ? 'секунды' : 'секунд'}
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>
            Окончание: {new Date(seasonSettings.endDate).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SeasonTimer; 