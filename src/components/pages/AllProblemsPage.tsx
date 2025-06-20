import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cloudDataService } from '../../services/cloudDataService';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { Problem } from '../../types';

export function AllProblemsPage() {
  const { currentUser } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [bonusPoints, setBonusPoints] = useState<number>(1);
  const [isAdmin, setIsAdmin] = useState(false);

  const categories = [
    { value: 'all', label: 'Все категории' },
    { value: 'ТО', label: 'ТО' },
    { value: 'Испытания', label: 'Испытания' },
    { value: 'Аудит', label: 'Аудит' },
    { value: 'Безопасность', label: 'Безопасность' },
    { value: 'Качество', label: 'Качество' },
    { value: 'Оборудование', label: 'Оборудование' },
    { value: 'Процессы', label: 'Процессы' },
    { value: 'Другое', label: 'Другое' }
  ];

  useEffect(() => {
    checkAdminStatus();
    loadProblems();
  }, [currentUser]);

  const checkAdminStatus = async () => {
    if (currentUser) {
      const adminStatus = await cloudDataService.isAdmin(currentUser.uid, currentUser.email || '');
      setIsAdmin(adminStatus);
    }
  };

  const loadProblems = async () => {
    try {
      setLoading(true);
      const data = await cloudDataService.getAllProblems();
      setProblems(data);
    } catch (error) {
      console.error('Ошибка загрузки проблем:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBonusPoints = async (problem: Problem) => {
    if (!currentUser || !isAdmin) return;

    try {
      await cloudDataService.addBonusPoints(
        problem.id, 
        bonusPoints, 
        currentUser.uid, 
        currentUser.email || ''
      );
      
      alert(`✅ Добавлено ${bonusPoints} бонусных баллов!`);
      setSelectedProblem(null);
      setBonusPoints(1);
      await loadProblems();
    } catch (error: any) {
      alert(`❌ Ошибка: ${error.message}`);
    }
  };

  const handleToggleReviewed = async (problem: Problem) => {
    if (!currentUser || !isAdmin) return;

    try {
      await cloudDataService.markProblemAsReviewed(
        problem.id,
        currentUser.uid,
        currentUser.email || ''
      );
      
      await loadProblems();
    } catch (error: any) {
      alert(`❌ Ошибка: ${error.message}`);
    }
  };

  const filteredProblems = selectedCategory === 'all' 
    ? problems 
    : problems.filter(p => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Доступ запрещен</h1>
        <p className="text-gray-600">Эта страница доступна только администраторам</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">📋 Все проблемы</h1>

      {/* Фильтр по категориям */}
      <div className="mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{problems.length}</div>
          <div className="text-sm text-gray-600">Всего проблем</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            {problems.filter(p => p.reviewed).length}
          </div>
          <div className="text-sm text-gray-600">Просмотрено</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">
            {problems.reduce((sum, p) => sum + p.points, 0)}
          </div>
          <div className="text-sm text-gray-600">Всего баллов</div>
        </div>
      </div>

      {/* Список проблем */}
      <div className="space-y-4">
        {filteredProblems.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Нет проблем в выбранной категории</p>
          </div>
        ) : (
          filteredProblems.map((problem) => (
            <div
              key={problem.id}
              className={`bg-white rounded-lg shadow p-6 ${
                problem.reviewed ? 'opacity-75' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {problem.title}
                    {problem.reviewed && (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    )}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>{problem.authorName}</span>
                    <span>{new Date(problem.createdAt).toLocaleDateString('ru-RU')}</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      {problem.category}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {problem.points}
                  </div>
                  <div className="text-xs text-gray-500">баллов</div>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{problem.description}</p>

              {/* Изображения */}
              {problem.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {problem.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Фото ${index + 1}`}
                      className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-90"
                      onClick={() => window.open(image, '_blank')}
                    />
                  ))}
                </div>
              )}

              {/* Админские действия */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <button
                  onClick={() => handleToggleReviewed(problem)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    problem.reviewed
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {problem.reviewed ? '❌ Снять отметку' : '✅ Отметить как просмотренное'}
                </button>
                
                <button
                  onClick={() => setSelectedProblem(problem)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium"
                >
                  ➕ Добавить бонусные баллы
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно для добавления баллов */}
      {selectedProblem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Добавить бонусные баллы
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Проблема: "{selectedProblem.title}"
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Количество баллов (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={bonusPoints}
                onChange={(e) => setBonusPoints(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleAddBonusPoints(selectedProblem)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Добавить
              </button>
              <button
                onClick={() => {
                  setSelectedProblem(null);
                  setBonusPoints(1);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 