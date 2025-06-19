import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cloudDataService } from '../../services/cloudDataService';

const SubmitProblemPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeasonActive, setIsSeasonActive] = useState(true);

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
    checkSeasonStatus();
  }, []);

  const checkSeasonStatus = async () => {
    try {
      const settings = await cloudDataService.getSeasonSettings();
      setIsSeasonActive(settings.isActive && !settings.isFinished);
    } catch (error) {
      console.error('Ошибка проверки статуса сезона:', error);
      setIsSeasonActive(true); // По умолчанию разрешаем
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Проверяем количество файлов
    if (files.length > 5) {
      alert('❌ Можно загрузить максимум 5 изображений');
      return;
    }

    // Проверяем размер каждого файла (макс 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    for (const file of files) {
      if (file.size > maxSize) {
        alert(`❌ Файл "${file.name}" слишком большой. Максимальный размер: 10MB`);
        return;
      }
    }

    setImages(files);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('❌ Необходимо войти в систему');
      return;
    }

    if (!isSeasonActive) {
      alert('❌ Отправка проблем временно приостановлена администратором');
      return;
    }

    if (!title.trim() || !description.trim() || !category) {
      alert('❌ Заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);

    try {
      // Получаем имя пользователя
      const authorName = await cloudDataService.getUserDisplayName(currentUser.uid, currentUser.email || '');
      
      // Конвертируем изображения в base64
      const imageBase64Array: string[] = [];
      for (const file of images) {
        try {
          const base64String = await cloudDataService.saveImage(file);
          imageBase64Array.push(base64String);
        } catch (error) {
          console.error('Ошибка конвертации изображения:', error);
        }
      }

      // Сохраняем проблему в Firebase
      await cloudDataService.addProblem({
        title: title.trim(),
        description: description.trim(),
        category,
        authorId: currentUser.uid,
        authorName,
        images: imageBase64Array
      });

      alert('✅ Проблема успешно отправлена! Вы получили +1 балл');
      
      // Очищаем форму
      setTitle('');
      setDescription('');
      setCategory('');
      setImages([]);
      
      // Уведомляем другие компоненты об обновлении
      window.dispatchEvent(new CustomEvent('userStatsUpdated'));
      
    } catch (error: any) {
      console.error('Ошибка отправки проблемы:', error);
      alert(`❌ Ошибка отправки: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Требуется авторизация</h2>
          <p className="text-gray-600">Войдите в систему, чтобы отправлять проблемы</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8">
      {/* Заголовок */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          📝 Отправить проблему
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Опишите найденную проблему и получите +1 балл
        </p>
      </div>

      {/* Информация о сохранении */}
      <div className="mb-6 sm:mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">☁️</span>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800">Облачное сохранение</h3>
            <p className="text-sm text-blue-600">
              Ваша проблема будет сохранена в Firebase Firestore и станет видна всем участникам.<br />
              Изображения сохраняются как base64 строки в базе данных.
            </p>
          </div>
        </div>
      </div>

      {/* Статус сезона */}
      {!isSeasonActive && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">⏸️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Отправка приостановлена</h3>
              <p className="text-sm text-red-600">
                Администратор временно приостановил прием новых проблем. Попробуйте позже.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Форма */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Название проблемы */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Название проблемы *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Кратко опишите суть проблемы..."
            maxLength={100}
            disabled={isSubmitting || !isSeasonActive}
          />
          <p className="text-xs text-gray-500 mt-1">
            {title.length}/100 символов
          </p>
        </div>

        {/* Категория */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Категория *
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting || !isSeasonActive}
          >
            <option value="">Выберите категорию...</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Описание */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Подробное описание *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Опишите проблему подробно: что именно не так, где обнаружено, какие могут быть последствия..."
            maxLength={1000}
            disabled={isSubmitting || !isSeasonActive}
          />
          <p className="text-xs text-gray-500 mt-1">
            {description.length}/1000 символов
          </p>
        </div>

        {/* Изображения */}
        <div>
          <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
            Фотографии (необязательно)
          </label>
          <input
            type="file"
            id="images"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting || !isSeasonActive}
          />
          <p className="text-xs text-gray-500 mt-1">
            Максимум 5 изображений, до 10MB каждое. Поддерживаются: JPG, PNG, GIF
          </p>
          
          {/* Превью изображений */}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Превью ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    disabled={isSubmitting}
                  >
                    ×
                  </button>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Кнопка отправки */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !isSeasonActive || !title.trim() || !description.trim() || !category}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Отправляем...
              </span>
            ) : (
              '📤 Отправить проблему (+1 балл)'
            )}
          </button>
        </div>
      </form>

      {/* Подсказки */}
      <div className="mt-6 sm:mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">💡 Советы по заполнению</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• <strong>Название:</strong> Кратко и ясно сформулируйте суть проблемы</li>
          <li>• <strong>Категория:</strong> Выберите наиболее подходящую область</li>
          <li>• <strong>Описание:</strong> Укажите детали: что, где, когда, какие риски</li>
          <li>• <strong>Фото:</strong> Приложите снимки для лучшего понимания проблемы</li>
          <li>• <strong>Баллы:</strong> За каждую проблему +1 балл, админ может добавить бонус</li>
        </ul>
      </div>
    </div>
  );
};

export default SubmitProblemPage; 