import React, { useState } from 'react';
import { cloudDataService } from '../../services/cloudDataService';
import { useAuth } from '../../contexts/AuthContext';

const categories = [
  'ТО',
  'Испытания', 
  'Аудит',
  'Безопасность',
  'Качество',
  'Оборудование',
  'Процессы',
  'Другое'
];

const SubmitProblemPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });
    
    if (validFiles.length + images.length > 5) {
      alert('Максимум 5 изображений');
      return;
    }
    
    setImages(prev => [...prev, ...validFiles]);
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

    if (!title.trim() || !description.trim() || !category) {
      alert('Заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      // Обрабатываем изображения
      const imagePromises = images.map(async (image) => {
        const imageName = await cloudDataService.saveImage(image);
        return imageName;
      });
      const imageNames = await Promise.all(imagePromises);

      // Получаем имя пользователя
      const displayName = await cloudDataService.getUserDisplayName(
        currentUser.uid, 
        currentUser.email || ''
      );

      // Сохраняем пользователя в базе
      await cloudDataService.saveUser({
        id: currentUser.uid,
        email: currentUser.email || '',
        fullName: displayName,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      });

      // Создаем проблему
      const problem = await cloudDataService.addProblem({
        title: title.trim(),
        description: description.trim(),
        category,
        authorId: currentUser.uid,
        authorName: displayName,
        images: imageNames,
      });

      console.log('✅ Проблема создана:', problem);

      setSuccessMessage('🎉 Проблема успешно отправлена! Вы получили +1 балл.');
      
      // Очищаем форму
      setTitle('');
      setDescription('');
      setCategory('');
      setImages([]);

      // Скрываем сообщение через 3 секунды
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Ошибка отправки проблемы:', error);
      alert('Ошибка при отправке проблемы. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          📝 Сообщить о проблеме
        </h1>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Название проблемы */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название проблемы *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Кратко опишите суть проблемы"
              required
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Подробное описание *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Опишите проблему подробно: что произошло, где, когда, какие могут быть последствия"
              required
            />
          </div>

          {/* Категория */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Категория *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Выберите категорию</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Загрузка изображений */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Фотографии (до 5 шт., до 10 МБ каждая)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {images.length > 0 && (
              <div className="mt-3 space-y-2">
                {images.map((image, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">{image.name}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Кнопка отправки */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Отправка...' : 'Отправить проблему (+1 балл)'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">💡 Советы для качественного сообщения:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Будьте конкретны в описании</li>
            <li>• Укажите точное место и время</li>
            <li>• Приложите фотографии если возможно</li>
            <li>• Опишите потенциальные риски</li>
            <li>• Предложите решение если есть идеи</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubmitProblemPage; 