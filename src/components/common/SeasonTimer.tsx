import React, { useState, useEffect } from 'react';
import { cloudDataService } from '../../services/cloudDataService';

export function SeasonTimer() {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [seasonSettings, setSeasonSettings] = useState<any>(null);

  useEffect(() => {
    loadSeasonSettings();
  }, []);

  useEffect(() => {
    if (!seasonSettings || !seasonSettings.isActive) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const endDate = new Date(seasonSettings.endDate || seasonSettings.seasonEndDate).getTime();
      const difference = endDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft(null);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [seasonSettings]);

  const loadSeasonSettings = async () => {
    try {
      const settings = await cloudDataService.getSeasonSettings();
      setSeasonSettings(settings);
    } catch (error) {
      console.error('Ошибка загрузки настроек сезона:', error);
    }
  };

  if (!seasonSettings || !seasonSettings.isActive) {
    return null;
  }

  if (!timeLeft) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 text-center">
        <h2 className="text-xl font-semibold text-red-800 mb-2">
          ⏰ Время вышло!
        </h2>
        <p className="text-red-600">
          Сезон завершен. Ожидайте результатов.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-blue-800 mb-4 text-center">
        ⏱️ До конца сезона осталось:
      </h2>
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="bg-white rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-600">{timeLeft.days}</div>
          <div className="text-sm text-gray-600">дней</div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-600">{timeLeft.hours}</div>
          <div className="text-sm text-gray-600">часов</div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-600">{timeLeft.minutes}</div>
          <div className="text-sm text-gray-600">минут</div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-600">{timeLeft.seconds}</div>
          <div className="text-sm text-gray-600">секунд</div>
        </div>
      </div>
      <p className="text-center text-sm text-blue-600 mt-4">
        Успейте отправить найденные проблемы!
      </p>
    </div>
  );
} 