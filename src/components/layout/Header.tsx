import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    if (currentUser) {
      fetchDisplayName();
    }
  }, [currentUser]);

  const fetchDisplayName = async () => {
    if (!currentUser) return;

    // Сначала пробуем displayName из Firebase Auth
    if (currentUser.displayName) {
      setDisplayName(currentUser.displayName);
      return;
    }

    // Затем пробуем получить из Firestore
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.fullName) {
          setDisplayName(userData.fullName);
          return;
        }
      }
    } catch (error) {
      console.log('Не удалось получить данные из Firestore:', error);
    }

    // В крайнем случае используем часть email
    if (currentUser.email) {
      setDisplayName(currentUser.email.split('@')[0]);
    } else {
      setDisplayName('Пользователь');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Логотип */}
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🏭</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Система отчетов ПНР</h1>
              <p className="text-sm text-gray-500">Сообщайте о проблемах и помогайте улучшать процессы</p>
            </div>
          </div>

          {/* Информация о пользователе */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">
                {displayName || 'Пользователь'}
              </p>
              <p className="text-xs text-gray-500">{currentUser?.email}</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 