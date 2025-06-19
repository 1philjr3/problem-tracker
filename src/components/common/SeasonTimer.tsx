import { cloudDataService, type SeasonSettings } from '../../services/cloudDataService';
import React, { useState, useEffect } from 'react';

export const SeasonTimer: React.FC = () => {
  const [settings, setSettings] = useState<SeasonSettings | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeasonSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      const timer = setInterval(() => {
        updateTimeLeft();
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [settings]);

  const loadSeasonSettings = async () => {
    try {
      setLoading(true);
      const settings = await cloudDataService.getSeasonSettings();
      setSettings(settings);
    } catch (error) {
      console.error('Ошибка загрузки настроек сезона:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTimeLeft = () => {
    if (!settings) return;

    const now = new Date().getTime();
    const endTime = new Date(settings.seasonEndDate).getTime();
    const difference = endTime - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${days}д ${hours}ч ${minutes}м ${seconds}с`);
    } else {
      setTimeLeft('Сезон завершен');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-gray-500 text-center">Ошибка загрузки настроек сезона</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          ⏰ {settings.currentSeason}
        </h2>
        
        {settings.isActive ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              До завершения сезона:
            </p>
            <div className="text-3xl font-bold text-blue-600 mb-4">
              {timeLeft}
            </div>
            <div className="text-sm text-gray-500">
              Сезон: {new Date(settings.seasonStartDate).toLocaleDateString('ru-RU')} - {new Date(settings.seasonEndDate).toLocaleDateString('ru-RU')}
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              Сезон неактивен
            </div>
            <p className="text-sm text-gray-500">
              Ожидайте начала нового сезона
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 