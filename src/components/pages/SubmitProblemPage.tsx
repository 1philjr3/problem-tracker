import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { localDataService } from '../../services/localDataService';
import { googleSheetsAPIService } from '../../services/googleSheetsAPIService';

const SubmitProblemPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'maintenance',
  });
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'maintenance', label: 'ТО', emoji: '🔧' },
    { value: 'testing', label: 'Испытания', emoji: '🧪' },
    { value: 'audit', label: 'Аудит', emoji: '🔊' },
    { value: 'pnr', label: 'ПНР', emoji: '🏭' },
    { value: 'safety', label: 'Безопасность', emoji: '⚠️' },
    { value: 'quality', label: 'Качество', emoji: '✅' },
    { value: 'equipment', label: 'Оборудование', emoji: '⚙️' },
    { value: 'process', label: 'Процессы', emoji: '🔄' },
    { value: 'other', label: 'Другое', emoji: '📝' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Проверяем размер файлов (макс 5MB)
      const maxSize = 5 * 1024 * 1024;
      const oversizedFiles = newFiles.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        alert('Размер изображения не должен превышать 5MB');
        return;
      }
      
      // Проверяем тип файлов
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const invalidFiles = newFiles.filter(file => !allowedTypes.includes(file.type));
      if (invalidFiles.length > 0) {
        alert('Поддерживаются только форматы: JPEG, PNG, WebP');
        return;
      }
      
      setImages(prev => [...prev, ...newFiles].slice(0, 5)); // Максимум 5 файлов
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('Необходимо войти в систему');
      return;
    }
    
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);

    try {
      // Сохраняем изображения
      const imageNames: string[] = [];
      const imageBase64List: string[] = [];
      
      for (const image of images) {
        const imageName = await localDataService.saveImage(image);
        imageNames.push(imageName);
        
        // Конвертируем первое изображение в base64 для Google Sheets
        if (imageBase64List.length === 0) {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(image);
          });
          imageBase64List.push(base64);
        }
      }

      // Получаем правильное ФИО пользователя
      const displayName = await localDataService.getUserDisplayName(
        currentUser.uid, 
        currentUser.email || ''
      );

      // Сначала убеждаемся что пользователь сохранен в локальной базе
      await localDataService.saveUser({
        id: currentUser.uid,
        email: currentUser.email || '',
        fullName: displayName,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      });

      // Создаем проблему
      const problem = await localDataService.addProblem({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        authorId: currentUser.uid,
        authorName: displayName,
        images: imageNames,
      });

      // Отправляем данные в Google Sheets
      try {
        await googleSheetsAPIService.addSurveyData({
          title: formData.title.trim(),
          category: formData.category,
          metric: 'Проблема ПНР', // Можно настроить отдельно
          description: formData.description.trim(),
          imageBase64: imageBase64List[0] || '',
          authorId: currentUser.uid,
          authorName: displayName
        });
        console.log('✅ Данные также сохранены в Google Sheets');
      } catch (error) {
        console.error('⚠️ Не удалось сохранить в Google Sheets:', error);
      }

      // Показываем успех
      alert(`✅ Проблема "${problem.title}" успешно отправлена! Вы получили +1 балл.`);
      
      // Уведомляем другие компоненты об обновлении данных
      window.dispatchEvent(new CustomEvent('userStatsUpdated'));
      
      // Очищаем форму
      setFormData({ title: '', description: '', category: 'maintenance' });
      setImages([]);

      console.log('🎉 Проблема сохранена в локальную базу данных!');

    } catch (error) {
      console.error('Ошибка отправки проблемы:', error);
      alert('❌ Ошибка отправки проблемы. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📝 Сообщить о проблеме
        </h1>
        <p className="text-gray-600">
          Опишите найденную проблему и получите баллы за активность
        </p>
      </div>

      {/* Информация о системе */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">⭐</span>
          <div>
            <h3 className="font-semibold text-green-800">Реальная система данных</h3>
            <p className="text-sm text-green-600">
              • За каждую проблему: +1 балл автоматически<br />
              • Админ может добавить бонусные баллы за важные находки
            </p>
          </div>
        </div>
      </div>

      {/* Форма */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Название проблемы */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Название проблемы *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Кратко опишите проблему..."
          />
          <div className="text-xs text-gray-500 mt-1">
            {formData.title.length}/100 символов
          </div>
        </div>

        {/* Категория */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Категория *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.emoji} {cat.label}
              </option>
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
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={6}
            maxLength={1000}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Детально опишите проблему: что произошло, где, когда, какие могут быть последствия..."
          />
          <div className="text-xs text-gray-500 mt-1">
            {formData.description.length}/1000 символов
          </div>
        </div>

        {/* Загрузка изображений */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Фотографии (до 5 файлов, макс 5MB каждый)
          </label>
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {images.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Выбранные файлы:</p>
                <div className="grid grid-cols-1 gap-2">
                  {images.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Превью ${index + 1}`}
                          className="w-12 h-12 object-cover rounded border"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-700">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Кнопка отправки */}
        <button
          type="submit"
          disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isSubmitting || !formData.title.trim() || !formData.description.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Сохранение...</span>
            </div>
          ) : (
            '🚀 Отправить проблему (+1 балл)'
          )}
        </button>
      </form>

      {/* Дополнительная информация */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-2">💡 Советы для получения максимальных баллов:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li> Будьте максимально конкретны в описании проблемы</li>
          <li> Прикрепляйте качественные фотографии для лучшего понимания</li>
          <li> Указывайте точное местоположение и время обнаружения</li>
          <li> Описывайте потенциальные риски и последствия</li>
          <li> Админ может добавить до +10 бонусных баллов за особо важные находки</li>
        </ul>
      </div>
    </div>
  );
};

export default SubmitProblemPage; 