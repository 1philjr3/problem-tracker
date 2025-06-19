import React from 'react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'home',
      label: 'Главная',
      emoji: '🏠',
      description: 'Статистика и новости'
    },
    {
      id: 'submit',
      label: 'Отправить',
      emoji: '📝',
      description: 'Сообщить о проблеме'
    },
    {
      id: 'leaderboard',
      label: 'Рейтинг',
      emoji: '🏆',
      description: 'Таблица лидеров'
    },
    {
      id: 'all-problems',
      label: 'Все проблемы',
      emoji: '📋',
      description: 'Просмотр всех проблем'
    }
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4">
        {/* Мобильная навигация - горизонтальная прокрутка */}
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide sm:justify-center py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center min-w-0 flex-shrink-0 px-3 py-2 sm:px-6 sm:py-3 
                rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium
                ${activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-2 border-transparent'
                }
              `}
            >
              <span className="text-lg sm:text-xl mb-1">{tab.emoji}</span>
              <span className="font-semibold whitespace-nowrap">{tab.label}</span>
              <span className="text-xs text-gray-500 hidden sm:block mt-1">
                {tab.description}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Индикатор активной вкладки */}
      <div className="bg-blue-600 h-1 transition-all duration-300" 
           style={{
             width: `${100 / tabs.length}%`,
             marginLeft: `${tabs.findIndex(tab => tab.id === activeTab) * (100 / tabs.length)}%`
           }}
      />
    </nav>
  );
};

export default Navigation; 