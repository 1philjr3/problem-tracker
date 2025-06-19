import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onToggleMode: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Успешный вход - состояние изменится автоматически через AuthContext
    } catch (error: any) {
      console.error('Login error:', error);
      setError(getErrorMessage(error.code || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Пользователь с таким email не найден';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Неверный email или пароль';
      case 'auth/invalid-email':
        return 'Неверный формат email';
      case 'auth/too-many-requests':
        return 'Слишком много попыток входа. Попробуйте позже';
      case 'auth/network-request-failed':
        return 'Ошибка сети. Проверьте подключение к интернету';
      case 'auth/internal-error':
        return 'Внутренняя ошибка. Попробуйте позже';
      default:
        return `Произошла ошибка при входе: ${errorCode}`;
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Вход в систему</h2>
          <p className="text-gray-600 mt-2">Войдите в свой аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="input-field w-full"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              required
              className="input-field w-full"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Вход...</span>
                </div>
              ) : (
                'Войти'
              )}
            </button>

            <button
              type="button"
              onClick={onToggleMode}
              disabled={loading}
              className="btn-secondary w-full disabled:opacity-50"
            >
              Нет аккаунта? Зарегистрироваться
            </button>
          </div>
        </form>

        {/* Демо данные для тестирования */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 mb-2">🔧 Для тестирования:</p>
          <p className="text-xs text-blue-600">Сначала зарегистрируйтесь, затем войдите с теми же данными</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 