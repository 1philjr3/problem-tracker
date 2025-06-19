import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cloudDataService } from '../../services/cloudDataService';

interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  images: string[];
  bonusPoints: number;
  totalPoints: number;
}

const AllProblemsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProblem, setExpandedProblem] = useState<string | null>(null);

  const categories = [
    'ТО (Техническое обслуживание)',
    'Испытания',
    'Аудит',
    'Безопасность',
    'Качество',
    'Оборудование',
    'Процессы',
    'Другое'
  ];

  useEffect(() => {
    checkAdminStatus();
    loadProblems();
  }, [currentUser]);

  useEffect(() => {
    filterProblems();
  }, [problems, categoryFilter, authorFilter, searchTerm]);

  const checkAdminStatus = async () => {
    if (currentUser && currentUser.email === 'admin@mail.ru') {
      const adminStatus = await cloudDataService.isAdmin(currentUser.uid, currentUser.email || '');
      setIsAdmin(adminStatus);
    } else {
      setIsAdmin(false);
    }
  };

  const loadProblems = async () => {
    try {
      setLoading(true);
      const allProblems = await cloudDataService.getAllProblems();
      setProblems(allProblems);
      console.log('✅ Загружено проблем из Firebase:', allProblems.length);
    } catch (error) {
      console.error('❌ Ошибка загрузки проблем:', error);
      setProblems([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProblems = () => {
    let filtered = [...problems];

    // Фильтр по категории
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(problem => problem.category === categoryFilter);
    }

    // Фильтр по автору
    if (authorFilter !== 'all') {
      filtered = filtered.filter(problem => problem.authorName === authorFilter);
    }

    // Поиск по тексту
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(problem => 
        problem.title.toLowerCase().includes(search) ||
        problem.description.toLowerCase().includes(search) ||
        problem.authorName.toLowerCase().includes(search)
      );
    }

    // Сортировка по дате (новые сначала)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredProblems(filtered);
  };

  const handleAddBonus = async (problemId: string, currentBonus: number) => {
    if (!currentUser || !isAdmin) {
      alert('❌ Доступ запрещен');
      return;
    }

    const bonusStr = prompt(`Текущий бонус: ${currentBonus} баллов\n\nВведите новый бонус (1-10 баллов):`);
    if (!bonusStr) return;

    const bonus = parseInt(bonusStr);
    if (isNaN(bonus) || bonus < 0 || bonus > 10) {
      alert('❌ Бонус должен быть числом от 0 до 10');
      return;
    }

    try {
      await cloudDataService.addBonusPoints(problemId, bonus, currentUser.uid, currentUser.email || '');
      alert(`✅ Бонус ${bonus} баллов добавлен!`);
      await loadProblems();
      
      // Уведомляем другие компоненты
      window.dispatchEvent(new CustomEvent('userStatsUpdated'));
    } catch (error: any) {
      alert(`❌ Ошибка добавления бонуса: ${error.message}`);
    }
  };

  const toggleExpanded = (problemId: string) => {
    setExpandedProblem(expandedProblem === problemId ? null : problemId);
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

  const getUniqueAuthors = () => {
    const authors = [...new Set(problems.map(p => p.authorName))];
    return authors.filter(author => author !== 'admin').sort();
  };

  if (!currentUser) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Требуется авторизация</h2>
          <p className="text-gray-600">Войдите в систему, чтобы просматривать проблемы</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка проблем из Firebase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
      {/* Заголовок */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          📋 Все проблемы
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Общий список всех отправленных проблем
        </p>
      </div>

      {/* Информация о системе */}
      <div className="mb-6 sm:mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">☁️</span>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800">Облачная синхронизация</h3>
            <p className="text-sm text-blue-600">
              Все проблемы синхронизируются между пользователями через Firebase Firestore.<br />
              {isAdmin && 'Как администратор, вы можете добавлять бонусные баллы за важные находки.'}
            </p>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{problems.length}</div>
          <div className="text-sm text-gray-600">Всего проблем</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {problems.reduce((sum, p) => sum + p.totalPoints, 0)}
          </div>
          <div className="text-sm text-gray-600">Всего баллов</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {getUniqueAuthors().length}
          </div>
          <div className="text-sm text-gray-600">Участников</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {problems.reduce((sum, p) => sum + p.bonusPoints, 0)}
          </div>
          <div className="text-sm text-gray-600">Бонус баллов</div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">🔍 Фильтры и поиск</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Поиск */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Поиск</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по названию, описанию, автору..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Категория */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все категории</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Автор */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Автор</label>
            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все авторы</option>
              {getUniqueAuthors().map(author => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setCategoryFilter('all');
              setAuthorFilter('all');
              setSearchTerm('');
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            🔄 Сбросить фильтры
          </button>
          <span className="text-sm text-gray-600 self-center">
            Показано: {filteredProblems.length} из {problems.length} проблем
          </span>
        </div>
      </div>

      {/* Список проблем */}
      <div className="space-y-4">
        {filteredProblems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {problems.length === 0 ? 'Пока нет проблем' : 'Ничего не найдено'}
            </h3>
            <p className="text-gray-600">
              {problems.length === 0 
                ? 'Станьте первым! Отправьте проблему и получите баллы.'
                : 'Попробуйте изменить параметры поиска или фильтры.'
              }
            </p>
          </div>
        ) : (
          filteredProblems.map((problem) => (
            <div key={problem.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              {/* Заголовок проблемы */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{problem.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span>👤 {problem.authorName}</span>
                    <span>📅 {formatDate(problem.createdAt)}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {problem.category}
                    </span>
                  </div>
                </div>
                
                {/* Баллы */}
                <div className="text-right ml-4">
                  <div className="text-xl font-bold text-green-600">
                    +{problem.totalPoints}
                  </div>
                  <div className="text-xs text-gray-500">
                    {problem.bonusPoints > 0 && (
                      <span className="text-orange-600">
                        (+{problem.bonusPoints} бонус)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Краткое описание */}
              <div className="mb-4">
                <p className="text-gray-700">
                  {expandedProblem === problem.id 
                    ? problem.description
                    : `${problem.description.substring(0, 200)}${problem.description.length > 200 ? '...' : ''}`
                  }
                </p>
                
                {problem.description.length > 200 && (
                  <button
                    onClick={() => toggleExpanded(problem.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                  >
                    {expandedProblem === problem.id ? '▲ Свернуть' : '▼ Показать полностью'}
                  </button>
                )}
              </div>

              {/* Изображения */}
              {problem.images.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">📸 Фотографии ({problem.images.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {problem.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`}
                          alt={`Изображение ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            const img = new Image();
                            img.src = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
                            const newWindow = window.open();
                            if (newWindow) {
                              newWindow.document.write(`<img src="${img.src}" style="max-width:100%;height:auto;" />`);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Админские действия */}
              {isAdmin && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      🔑 Админские действия
                    </div>
                    <button
                      onClick={() => handleAddBonus(problem.id, problem.bonusPoints)}
                      className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      ⭐ Бонус баллы ({problem.bonusPoints}/10)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Кнопка обновления */}
      <div className="mt-8 text-center">
        <button
          onClick={loadProblems}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          🔄 Обновить список
        </button>
      </div>
    </div>
  );
};

export default AllProblemsPage; 