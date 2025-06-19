import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterFormProps {
  onToggleMode: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = (): string | null => {
    if (formData.password.length < 6) {
      return 'Пароль должен содержать минимум 6 символов';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Пароли не совпадают';
    }
    if (formData.fullName.trim().length < 2) {
      return 'ФИО должно содержать минимум 2 символа';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      await register(formData.email, formData.password, formData.fullName);
      setSuccess(true);
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(getErrorMessage(error.code || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Пользователь с таким email уже существует';
      case 'auth/invalid-email':
        return 'Неверный формат email';
      case 'auth/weak-password':
        return 'Слишком слабый пароль';
      case 'auth/network-request-failed':
        return 'Ошибка сети. Проверьте подключение к интернету';
      case 'auth/internal-error':
        return 'Внутренняя ошибка. Попробуйте позже';
      default:
        return `Произошла ошибка при регистрации: ${errorCode}`;
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card p-8 text-center">
          <div className="text-green-600 text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Регистрация завершена!</h2>
          <p className="text-gray-600 mb-6">
            Аккаунт успешно создан! Теперь вы можете войти в систему.
          </p>
          <div className="space-y-3">
            <button
              onClick={onToggleMode}
              className="btn-primary w-full"
            >
              Войти в систему
            </button>
            <p className="text-xs text-gray-500">
              💡 Используйте email и пароль, которые вы только что указали
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Регистрация</h2>
          <p className="text-gray-600 mt-2">Создайте новый аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              ФИО
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              className="input-field w-full"
              placeholder="Иванов Иван Иванович"
              value={formData.fullName}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input-field w-full"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input-field w-full"
              placeholder="Минимум 6 символов"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Подтвердите пароль
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="input-field w-full"
              placeholder="Повторите пароль"
              value={formData.confirmPassword}
              onChange={handleChange}
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
                  <span>Регистрация...</span>
                </div>
              ) : (
                'Зарегистрироваться'
              )}
            </button>

            <button
              type="button"
              onClick={onToggleMode}
              disabled={loading}
              className="btn-secondary w-full disabled:opacity-50"
            >
              Уже есть аккаунт? Войти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm; 