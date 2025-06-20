import React, { useState, useEffect } from 'react';
import { localDataService, type SeasonSettings } from '../../services/localDataService';

const SeasonTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [seasonSettings, setSeasonSettings] = useState<SeasonSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeasonSettings();
  }, []);

  useEffect(() => {
    if (seasonSettings) {
      const timer = setInterval(() => {
        updateTimer();
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [seasonSettings]);

  const loadSeasonSettings = async () => {
    try {
      const settings = await localDataService.getSeasonSettings();
      setSeasonSettings(settings);
    } catch (error) {
      console.error('Ошибка загрузки настроек сезона:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTimer = () => {
    if (!seasonSettings) return;

    const now = new Date().getTime();
    const endDate = new Date(seasonSettings.seasonEndDate).getTime();
    const difference = endDate - now;

    if (difference > 0) {
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      });
    } else {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!seasonSettings) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ⚠️ Настройки сезона не найдены
          </h3>
          <p className="text-gray-600">
            Обратитесь к администратору для настройки сезона
          </p>
        </div>
      </div>
    );
  }

  const isActive = seasonSettings.isActive;
  const hasEnded = new Date() > new Date(seasonSettings.seasonEndDate);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          ⏰ {seasonSettings.currentSeason}
        </h3>
        
        {!isActive ? (
          <div className="text-yellow-600">
            <div className="text-4xl mb-2">⏸️</div>
            <p className="font-medium">Сезон приостановлен</p>
            <p className="text-sm text-gray-600 mt-1">
              Администратор может возобновить сезон в любое время
            </p>
          </div>
        ) : hasEnded ? (
          <div className="text-red-600">
            <div className="text-4xl mb-2">🏁</div>
            <p className="font-medium">Сезон завершен!</p>
            <p className="text-sm text-gray-600 mt-1">
              Результаты сезона будут подведены в ближайшее время.<br />
              Следите за обновлениями!
            </p>
          </div>
        ) : (
          <div className="text-blue-600">
            <div className="text-4xl mb-2">⏳</div>
            <p className="font-medium mb-4">До окончания сезона:</p>
            
            <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-2 sm:p-3">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {timeLeft.days}
                </div>
                <div className="text-xs sm:text-sm text-blue-500">
                  дней
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-2 sm:p-3">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {timeLeft.hours}
                </div>
                <div className="text-xs sm:text-sm text-blue-500">
                  часов
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-2 sm:p-3">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {timeLeft.minutes}
                </div>
                <div className="text-xs sm:text-sm text-blue-500">
                  минут
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-2 sm:p-3">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {timeLeft.seconds}
                </div>
                <div className="text-xs sm:text-sm text-blue-500">
                  секунд
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              Начало: {new Date(seasonSettings.seasonStartDate).toLocaleDateString('ru-RU')}<br />
              Окончание: {new Date(seasonSettings.seasonEndDate).toLocaleDateString('ru-RU')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export { SeasonTimer }; 