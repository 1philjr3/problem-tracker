import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center py-4">
          {/* Логотип */}
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🏭</div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">Система отчетов ПНР</h1>
              <p className="text-sm text-gray-500">Сообщайте о проблемах и помогайте улучшать процессы</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 