import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { localDataService } from '../../services/localDataService';
import { googleSheetsAPIService } from '../../services/googleSheetsAPIService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const SubmitProblemPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'maintenance',
    metric: 'design'
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
    { value: 'warranty', label: 'Гарантия', emoji: '🛡️' },
    { value: 'other', label: 'Другое', emoji: '📝' },
  ];

  const metrics = [
    { value: 'design', label: 'Проектирование', emoji: '📐' },
    { value: 'installation', label: 'Монтаж', emoji: '🔨' },
    { value: 'interaction', label: 'Взаимодействие', emoji: '🤝' },
    { value: 'documentation', label: 'Документация', emoji: '📋' },
    { value: 'control', label: 'Контроль', emoji: '🔍' },
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

  // Функция для загрузки изображения в Firebase Storage
  const uploadImageToStorage = async (file: File): Promise<string> => {
    try {
      const timestamp = Date.now();
      const fileName = `images/${timestamp}_${file.name}`;
      const imageRef = ref(storage, fileName);
      
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      throw error;
    }
  };

  // Функция для получения полного имени пользователя
  const getUserFullName = async (): Promise<string> => {
    if (!currentUser) return 'Пользователь';

    // Сначала пробуем displayName из Firebase Auth
    if (currentUser.displayName) {
      return currentUser.displayName;
    }

    // Затем пробуем получить из Firestore
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.fullName) {
          return userData.fullName;
        }
      }
    } catch (error) {
      console.log('Не удалось получить данные из Firestore:', error);
    }

    // В крайнем случае используем часть email
    if (currentUser.email) {
      return currentUser.email.split('@')[0];
    }
    
    return 'Пользователь';
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
      // Загружаем изображения в Firebase Storage и получаем URL
      let imageUrl = '';
      if (images.length > 0) {
        try {
          imageUrl = await uploadImageToStorage(images[0]);
          console.log('✅ Изображение загружено:', imageUrl);
        } catch (error) {
          console.error('⚠️ Не удалось загрузить изображение:', error);
          // Продолжаем без изображения
        }
      }

      // Получаем полное имя пользователя
      const displayName = await getUserFullName();

      // Отправляем данные в Google Sheets
      try {
        await googleSheetsAPIService.addSurveyData({
          title: formData.title.trim(),
          category: formData.category,
          metric: formData.metric,
          description: formData.description.trim(),
          imageBase64: imageUrl, // Теперь это URL вместо base64
          authorId: currentUser.uid,
          authorName: displayName
        });
        console.log('✅ Данные сохранены в Google Sheets');
      } catch (error) {
        console.error('⚠️ Не удалось сохранить в Google Sheets:', error);
      }

      // Показываем успех
      alert(`✅ Проблема "${formData.title}" успешно отправлена!`);
      
      // Очищаем форму
      setFormData({ title: '', description: '', category: 'maintenance', metric: 'design' });
      setImages([]);

      console.log('🎉 Проблема отправлена!');

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
          Опишите найденную проблему, и мы обязательно рассмотрим ваше обращение
        </p>
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

        {/* Метрика */}
        <div>
          <label htmlFor="metric" className="block text-sm font-medium text-gray-700 mb-2">
            Метрика *
          </label>
          <select
            id="metric"
            name="metric"
            value={formData.metric}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {metrics.map(metric => (
              <option key={metric.value} value={metric.value}>
                {metric.emoji} {metric.label}
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
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform ${
            isSubmitting || !formData.title.trim() || !formData.description.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full"></div>
              <span>Отправляем...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">🚀</span>
              <span>Отправить проблему</span>
            </div>
          )}
        </button>
      </form>
    </div>
  );
};

export default SubmitProblemPage; 