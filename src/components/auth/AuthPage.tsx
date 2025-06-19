import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Логотип и заголовок */}
        <div className="text-center">
          <div className="text-6xl mb-4">🏭</div>
          <h1 className="text-3xl font-bold text-gray-900">Система отчетов</h1>
          <p className="text-gray-600 mt-2">
            Сообщи проблему — помоги улучшить ПНР. Получи баллы и призы!
          </p>
        </div>

        {/* Форма */}
        {isLogin ? (
          <LoginForm onToggleMode={toggleMode} />
        ) : (
          <RegisterForm onToggleMode={toggleMode} />
        )}

        {/* Дополнительная информация */}
        <div className="text-center text-sm text-gray-500">
          <p>
            💡 За каждую отправленную проблему вы получаете 1 балл
          </p>
          <p className="mt-1">
            🏆 Участвуйте в сезонном рейтинге и выигрывайте призы
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 