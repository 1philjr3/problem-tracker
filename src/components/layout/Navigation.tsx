import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { localDataService } from '../../services/localDataService';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [currentUser]);

  const checkAdminStatus = async () => {
    if (currentUser && currentUser.email === 'admin@mail.ru') {
      const adminStatus = await localDataService.isAdmin(currentUser.uid, currentUser.email || '');
      setIsAdmin(adminStatus);
    } else {
      setIsAdmin(false);
    }
  };

  const tabs = [
    {
      id: 'submit',
      label: 'Отправить проблему',
      emoji: '📝',
      description: 'Сообщить о проблеме'
    }
  ];

  // Добавляем вкладку настроек только для администраторов
  if (isAdmin) {
    tabs.push({
      id: 'settings',
      label: 'Настройки',
      emoji: '⚙️',
      description: 'Настройки системы'
    });
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4">
        {/* Навигация */}
        <div className="flex justify-center items-center py-4">
          {tabs.map((tab, index) => (
            <div key={tab.id} className="flex items-center">
              <button
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex flex-col items-center justify-center px-8 py-4 mx-2
                  rounded-xl transition-all duration-300 text-sm font-semibold
                  transform hover:scale-105 min-w-[160px] border-2
                  ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xl scale-105 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-blue-50 border-gray-200 hover:border-blue-300'
                  }
                `}
              >
                <span className="text-2xl mb-2">{tab.emoji}</span>
                <span className="font-bold whitespace-nowrap">{tab.label}</span>
                <span className={`text-xs mt-1 ${activeTab === tab.id ? 'text-blue-100' : 'opacity-75'}`}>
                  {tab.description}
                </span>
              </button>
              
              {/* Разделитель между кнопками, кроме последней */}
              {index < tabs.length - 1 && (
                <div className="w-px h-8 bg-gray-300 mx-2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 