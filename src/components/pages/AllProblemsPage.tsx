import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { localDataService, type LocalProblem, type LocalUser } from '../../services/localDataService';

interface ProblemWithUser extends LocalProblem {
  user: LocalUser;
}

const AllProblemsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [problems, setProblems] = useState<ProblemWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState<ProblemWithUser | null>(null);
  const [bonusPoints, setBonusPoints] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [reviewedFilter, setReviewedFilter] = useState<'all' | 'reviewed' | 'not_reviewed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadProblems();
    checkAdminStatus();
  }, [currentUser]);

  const checkAdminStatus = async () => {
    if (currentUser && currentUser.email === 'admin@mail.ru') {
      const adminStatus = await localDataService.isAdmin(currentUser.uid, currentUser.email || '');
      setIsAdmin(adminStatus);
      console.log(`🔍 AllProblemsPage checkAdminStatus: email=${currentUser.email}, isAdmin=${adminStatus}`);
    } else {
      setIsAdmin(false);
    }
  };

  const loadProblems = async () => {
    try {
      setLoading(true);
      
      // Загружаем реальные данные
      const [problemsData, allData] = await Promise.all([
        localDataService.getProblems(),
        localDataService.getAllData()
      ]);

      // Объединяем проблемы с данными пользователей
      const problemsWithUsers: ProblemWithUser[] = problemsData.map(problem => {
        const user = allData.users.find(u => u.id === problem.authorId);
        return {
          ...problem,
          user: user || {
            id: problem.authorId,
            email: 'unknown@email.com',
            fullName: problem.authorName,
            totalPoints: 0,
            totalProblems: 0,
            level: 'novice' as const,
            joinedAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
          }
        };
      });

      setProblems(problemsWithUsers);
      console.log('✅ Загружено проблем:', problemsWithUsers.length);

    } catch (error) {
      console.error('❌ Ошибка загрузки проблем:', error);
      setProblems([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = (category: string) => {
    const categories: Record<string, { name: string; emoji: string; color: string }> = {
      maintenance: { name: 'ТО', emoji: '🔧', color: 'bg-blue-100 text-blue-800' },
      testing: { name: 'Испытания', emoji: '🧪', color: 'bg-red-100 text-red-800' },
      audit: { name: 'Аудит', emoji: '📋', color: 'bg-purple-100 text-purple-800' },
      safety: { name: 'Безопасность', emoji: '⚠️', color: 'bg-yellow-100 text-yellow-800' },
      quality: { name: 'Качество', emoji: '✅', color: 'bg-green-100 text-green-800' },
      equipment: { name: 'Оборудование', emoji: '⚙️', color: 'bg-gray-100 text-gray-800' },
      process: { name: 'Процессы', emoji: '🔄', color: 'bg-pink-100 text-pink-800' },
      other: { name: 'Другое', emoji: '📝', color: 'bg-indigo-100 text-indigo-800' },
    };
    return categories[category] || categories.other;
  };

  const getLevelInfo = (level: string) => {
    const levels: Record<string, { name: string; emoji: string; color: string }> = {
      novice: { name: 'Новичок', emoji: '🏁', color: 'bg-green-100 text-green-800' },
      fighter: { name: 'Боец', emoji: '🛠️', color: 'bg-amber-100 text-amber-800' },
      master: { name: 'Мастер', emoji: '🧠', color: 'bg-violet-100 text-violet-800' },
    };
    return levels[level] || levels.novice;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddBonusPoints = async () => {
    if (!selectedProblem || !bonusPoints || !bonusReason.trim() || !currentUser) {
      alert('Заполните все поля');
      return;
    }

    if (!isAdmin) {
      alert('❌ Доступ запрещен: только администратор может добавлять бонусные баллы');
      return;
    }

    const points = parseInt(bonusPoints);
    if (isNaN(points) || points <= 0 || points > 10) {
      alert('Введите корректное количество баллов (1-10)');
      return;
    }

    try {
      await localDataService.addBonusPoints(
        selectedProblem.id, 
        points, 
        bonusReason, 
        currentUser.uid
      );

      alert(`✅ Добавлено ${points} бонусных баллов для "${selectedProblem.title}"!`);
      
      // Уведомляем другие компоненты об обновлении данных
      window.dispatchEvent(new CustomEvent('userStatsUpdated'));
      
      // Перезагружаем данные
      await loadProblems();
      
      setSelectedProblem(null);
      setBonusPoints('');
      setBonusReason('');
    } catch (error: any) {
      console.error('Ошибка добавления баллов:', error);
      alert(`❌ Ошибка добавления баллов: ${error.message}`);
    }
  };

  const handleMarkAsReviewed = async (problemId: string) => {
    if (!currentUser || !isAdmin) {
      alert('❌ Доступ запрещен: только администратор может отмечать проблемы как просмотренные');
      return;
    }

    try {
      await localDataService.markProblemAsReviewed(problemId, currentUser.uid, currentUser.email || '');
      
      // Перезагружаем данные
      await loadProblems();
      
      console.log('✅ Статус просмотра проблемы обновлен');
    } catch (error: any) {
      console.error('Ошибка обновления статуса просмотра:', error);
      alert(`❌ Ошибка: ${error.message}`);
    }
  };

  const filteredProblems = problems.filter(problem => {
    const matchesFilter = filter === 'all' || problem.status === filter;
    const matchesReviewedFilter = 
      reviewedFilter === 'all' || 
      (reviewedFilter === 'reviewed' && problem.reviewed) ||
      (reviewedFilter === 'not_reviewed' && !problem.reviewed);
    const matchesSearch = searchTerm === '' || 
      problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesReviewedFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка проблем...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📋 Все проблемы пользователей
        </h1>
        <p className="text-gray-600">
          Всего проблем: {problems.length} • Отфильтровано: {filteredProblems.length}
        </p>
      </div>

      {/* Информация о системе */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">💾</span>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800">Реальные данные пользователей</h3>
            <p className="text-sm text-blue-600">
              Все проблемы загружаются из локальной базы данных в реальном времени.<br />
              Данные и изображения сохраняются: /Users/mike/Desktop/quiz/problem-tracker-data/
            </p>
            {isAdmin && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-xs text-red-600 font-medium">
                  🔑 Режим администратора: доступно добавление бонусных баллов
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Поиск */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Поиск по названию, описанию или автору..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Фильтр по статусу */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'reviewed')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидают рассмотрения</option>
            <option value="reviewed">Рассмотрены</option>
          </select>

          {/* Фильтр по просмотру (только для админа) */}
          {isAdmin && (
            <select
              value={reviewedFilter}
              onChange={(e) => setReviewedFilter(e.target.value as 'all' | 'reviewed' | 'not_reviewed')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все проблемы</option>
              <option value="reviewed">👁️ Просмотренные</option>
              <option value="not_reviewed">❌ Не просмотренные</option>
            </select>
          )}
        </div>

        <div className="text-sm text-gray-600">
          Показано: {filteredProblems.length} из {problems.length} проблем
          {isAdmin && (
            <span className="ml-4">
              • Просмотрено: {problems.filter(p => p.reviewed).length} 
              • Не просмотрено: {problems.filter(p => !p.reviewed).length}
            </span>
          )}
        </div>
      </div>

      {/* Список проблем */}
      <div className="space-y-4">
        {filteredProblems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤷‍♂️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {problems.length === 0 ? 'Проблем пока нет' : 'Проблем не найдено'}
            </h3>
            <p className="text-gray-600">
              {problems.length === 0 
                ? 'Как только пользователи начнут отправлять проблемы, они появятся здесь автоматически.'
                : 'Попробуйте изменить фильтры или поисковый запрос'
              }
            </p>
          </div>
        ) : (
          filteredProblems.map((problem) => {
            const categoryInfo = getCategoryInfo(problem.category);
            const levelInfo = getLevelInfo(problem.user.level);
            
            return (
              <div key={problem.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Основная информация */}
                  <div className="flex-1 space-y-3">
                    {/* Заголовок и категория */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Галочка просмотра для админа */}
                      {isAdmin && (
                        <button
                          onClick={() => handleMarkAsReviewed(problem.id)}
                          className={`flex items-center justify-center w-6 h-6 rounded border-2 transition-colors ${
                            problem.reviewed 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                          title={problem.reviewed ? 'Снять отметку о просмотре' : 'Отметить как просмотренную'}
                        >
                          {problem.reviewed && <span className="text-xs">✓</span>}
                        </button>
                      )}
                      
                      <h3 className="text-lg font-semibold text-gray-900">
                        {problem.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                        {categoryInfo.emoji} {categoryInfo.name}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        problem.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {problem.status === 'pending' ? '⏳ Ожидает' : '✅ Рассмотрено'}
                      </span>
                      
                      {/* Индикатор просмотра */}
                      {problem.reviewed && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          👁️ Просмотрено
                        </span>
                      )}
                    </div>

                    {/* Описание */}
                    <p className="text-gray-700 leading-relaxed">
                      {problem.description}
                    </p>

                    {/* Автор и дата */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelInfo.color}`}>
                          {levelInfo.emoji} {levelInfo.name}
                        </span>
                        <span className="font-medium">{problem.user.fullName}</span>
                        <span className="text-xs text-gray-500">({problem.user.totalPoints} баллов)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>📅</span>
                        <span>{formatDate(problem.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>⭐</span>
                        <span className="font-semibold text-blue-600">{problem.points} баллов</span>
                      </div>
                      
                      {/* Информация о просмотре */}
                      {problem.reviewed && problem.reviewedAt && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <span>👁️</span>
                          <span>Просмотрено {formatDate(problem.reviewedAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* Заметки админа */}
                    {problem.adminNotes && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600">💬</span>
                          <div>
                            <p className="text-sm font-medium text-blue-800">Заметка администратора:</p>
                            <p className="text-sm text-blue-700">{problem.adminNotes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Изображения и действия */}
                  <div className="lg:w-64 space-y-4">
                    {/* Изображения */}
                    {problem.images.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          📸 Изображения ({problem.images.length}):
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {problem.images.slice(0, 4).map((imageName, index) => (
                            <div key={index} className="bg-gray-100 rounded-lg p-2 text-center">
                              <div className="text-2xl mb-1">🖼️</div>
                              <p className="text-xs text-gray-600 truncate">
                                {imageName}
                              </p>
                            </div>
                          ))}
                        </div>
                        {problem.images.length > 4 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{problem.images.length - 4} еще...
                          </p>
                        )}
                      </div>
                    )}

                    {/* Админские действия */}
                    {isAdmin && (
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedProblem(problem)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          ⭐ Добавить баллы
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Кнопки действий */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button
          onClick={loadProblems}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          🔄 Обновить список
        </button>
        <button
          onClick={() => localDataService.exportData()}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          📦 Экспорт данных
        </button>
      </div>

      {/* Модальное окно для добавления бонусных баллов */}
      {selectedProblem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              ⭐ Добавить бонусные баллы
            </h3>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Проблема:</strong> {selectedProblem.title}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Автор:</strong> {selectedProblem.user.fullName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Текущие баллы:</strong> {selectedProblem.points}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Количество бонусных баллов (1-10):
                </label>
                <input
                  type="number"
                  value={bonusPoints}
                  onChange={(e) => setBonusPoints(e.target.value)}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите количество баллов"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Причина начисления:
                </label>
                <textarea
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Опишите за что начисляются баллы..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddBonusPoints}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ✅ Добавить баллы
              </button>
              <button
                onClick={() => {
                  setSelectedProblem(null);
                  setBonusPoints('');
                  setBonusReason('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ❌ Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllProblemsPage; 