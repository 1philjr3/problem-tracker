import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { getCategoryInfo } from '../../types/index';
import type { Problem, User } from '../../types/index';

const AllProblemsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [bonusPoints, setBonusPoints] = useState<number>(1);

  useEffect(() => {
    checkAdminStatus();
    loadData();
  }, [currentUser]);

  const checkAdminStatus = async () => {
    if (!currentUser) return;
    
    const adminStatus = await dataService.isAdmin(currentUser.uid, currentUser.email || '');
    setIsAdmin(adminStatus);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем проблемы и пользователей параллельно
      const [problemsData, allData] = await Promise.all([
        dataService.getProblems(),
        dataService.getAllData()
      ]);
      
      setProblems(problemsData);
      
      // Создаем словарь пользователей для быстрого доступа
      const usersMap: Record<string, User> = {};
      allData.users.forEach((user: User) => {
        usersMap[user.id] = user;
      });
      setUsers(usersMap);
      
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация проблем
  const filteredProblems = problems.filter(problem => {
    if (selectedCategory !== 'all' && problem.category !== selectedCategory) return false;
    if (selectedUser !== 'all' && problem.authorId !== selectedUser) return false;
    if (selectedStatus === 'reviewed' && !problem.reviewed) return false;
    if (selectedStatus === 'unreviewed' && problem.reviewed) return false;
    return true;
  });

  // Уникальные пользователи для фильтра
  const uniqueUsers = Array.from(new Set(problems.map(p => p.authorId)))
    .map(userId => ({
      id: userId,
      name: users[userId]?.fullName || 'Неизвестный пользователь'
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Статистика
  const stats = {
    total: problems.length,
    reviewed: problems.filter(p => p.reviewed).length,
    unreviewed: problems.filter(p => !p.reviewed).length,
    totalPoints: problems.reduce((sum, p) => sum + (p.points || 1), 0)
  };

  const handleAddBonusPoints = async (problemId: string, points: number) => {
    if (!currentUser || !isAdmin) return;
    
    try {
      await dataService.addBonusPoints(
        problemId,
        points,
        currentUser.uid,
        currentUser.email || ''
      );
      
      await loadData();
      setSelectedProblem(null);
      setBonusPoints(1);
      
      alert(`✅ Добавлено ${points} бонусных баллов!`);
    } catch (error) {
      console.error('Ошибка добавления баллов:', error);
      alert('❌ Ошибка добавления баллов');
    }
  };

  const handleToggleReviewed = async (problemId: string) => {
    if (!currentUser || !isAdmin) return;
    
    try {
      await dataService.markProblemAsReviewed(problemId, currentUser.uid, currentUser.email || '');
      await loadData();
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      alert('❌ Ошибка обновления статуса');
    }
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📋 Все проблемы
        </h1>
        <p className="text-gray-600">
          Полный список отправленных проблем от всех участников
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Всего проблем</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.reviewed}</div>
          <div className="text-sm text-gray-600">Просмотрено</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.unreviewed}</div>
          <div className="text-sm text-gray-600">Не просмотрено</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.totalPoints}</div>
          <div className="text-sm text-gray-600">Всего баллов</div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">🔍 Фильтры</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все категории</option>
              <option value="maintenance">🔧 ТО</option>
              <option value="testing">🧪 Испытания</option>
              <option value="audit">📋 Аудит</option>
              <option value="pnr">🏭 ПНР</option>
              <option value="safety">⚠️ Безопасность</option>
              <option value="quality">✅ Качество</option>
              <option value="equipment">⚙️ Оборудование</option>
              <option value="process">🔄 Процессы</option>
              <option value="other">📝 Другое</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Участник
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все участники</option>
              {uniqueUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Статус просмотра
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все</option>
              <option value="reviewed">✅ Просмотренные</option>
              <option value="unreviewed">⏳ Не просмотренные</option>
            </select>
          </div>
        </div>
      </div>

      {/* Список проблем */}
      <div className="space-y-4">
        {filteredProblems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Проблемы не найдены
            </h3>
            <p className="text-gray-600">
              Попробуйте изменить фильтры или дождитесь новых проблем
            </p>
          </div>
        ) : (
          filteredProblems.map(problem => {
            const author = users[problem.authorId];
            const categoryInfo = getCategoryInfo(problem.category);
            
            return (
              <div
                key={problem.id}
                className={`bg-white rounded-lg shadow-sm border ${
                  problem.reviewed ? 'border-green-200' : 'border-gray-200'
                } p-4 md:p-6`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Заголовок и категория */}
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{categoryInfo.emoji}</span>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {problem.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm">
                          <span className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${categoryInfo.color}20`,
                              color: categoryInfo.color
                            }}
                          >
                            {categoryInfo.name}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-600">
                            {author?.fullName || 'Неизвестный пользователь'}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-500">
                            {formatDate(problem.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Описание */}
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {problem.description}
                    </p>

                    {/* Изображения */}
                    {problem.images && problem.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {problem.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Изображение ${index + 1}`}
                              className="h-20 w-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75"
                              onClick={() => window.open(image, '_blank')}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Статус просмотра */}
                    {problem.reviewed && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Просмотрено админом</span>
                        {problem.reviewedAt && (
                          <span className="text-gray-500">
                            ({formatDate(problem.reviewedAt)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Баллы и действия */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {problem.points || 1}
                      </div>
                      <div className="text-sm text-gray-600">
                        {problem.points === 1 ? 'балл' : problem.points && problem.points < 5 ? 'балла' : 'баллов'}
                      </div>
                    </div>

                    {/* Админские действия */}
                    {isAdmin && currentUser?.email === 'admin@mail.ru' && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setSelectedProblem(problem)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-lg"
                        >
                          ➕ Добавить баллы
                        </button>
                        <button
                          onClick={() => handleToggleReviewed(problem.id)}
                          className={`text-sm px-3 py-1 rounded-lg ${
                            problem.reviewed
                              ? 'bg-gray-600 hover:bg-gray-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {problem.reviewed ? '👁️ Снять отметку' : '✅ Отметить просмотренным'}
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

      {/* Модальное окно добавления баллов */}
      {selectedProblem && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Добавить бонусные баллы
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Проблема: "{selectedProblem.title}"
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Количество бонусных баллов (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={bonusPoints}
                onChange={(e) => setBonusPoints(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleAddBonusPoints(selectedProblem.id, bonusPoints)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
              >
                ✅ Добавить
              </button>
              <button
                onClick={() => {
                  setSelectedProblem(null);
                  setBonusPoints(1);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
              >
                ❌ Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Кнопка экспорта */}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => dataService.exportData()}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
        >
          📥 Экспорт всех данных
        </button>
      </div>
    </div>
  );
};

export default AllProblemsPage; 