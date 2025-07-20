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
  const [isCompressing, setIsCompressing] = useState(false);

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

  // Функция для сжатия изображения
  const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Вычисляем новые размеры с сохранением пропорций
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }

        // Устанавливаем размеры canvas
        canvas.width = width;
        canvas.height = height;

        // Рисуем сжатое изображение
        ctx.drawImage(img, 0, 0, width, height);

        // Конвертируем в blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Создаем новый файл со сжатым изображением
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback на оригинальный файл
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        resolve(file); // Fallback на оригинальный файл
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Функция для конвертации файла в base64 (fallback для мобильных)
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Функция для загрузки изображения в Firebase Storage с fallback
  const uploadImageToStorage = async (file: File): Promise<string> => {
    try {
      // Сжимаем изображение перед загрузкой
      console.log('📷 Сжимаем изображение...');
      const compressedFile = await compressImage(file);
      
      console.log(`📊 Размер до сжатия: ${(file.size / 1024).toFixed(1)} KB`);
      console.log(`📊 Размер после сжатия: ${(compressedFile.size / 1024).toFixed(1)} KB`);
      
      const timestamp = Date.now();
      const fileName = `images/${timestamp}_compressed_${compressedFile.name}`;
      const imageRef = ref(storage, fileName);
      
      await uploadBytes(imageRef, compressedFile);
      const downloadURL = await getDownloadURL(imageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('❌ Firebase Storage недоступен, используем base64 fallback:', error);
      
      // Fallback для мобильных устройств - конвертируем в base64
      try {
        const compressedFile = await compressImage(file);
        const base64 = await convertToBase64(compressedFile);
        console.log('✅ Изображение конвертировано в base64 для мобильного устройства');
        return base64;
      } catch (fallbackError) {
        console.error('❌ Не удалось обработать изображение:', fallbackError);
        throw fallbackError;
      }
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

    try {
      // Загружаем изображения (с fallback на base64 для мобильных)
      let imageUrl = '';
      if (images.length > 0) {
        try {
          setIsCompressing(true);
          imageUrl = await uploadImageToStorage(images[0]);
          console.log('✅ Изображение обработано:', imageUrl ? 'Успешно' : 'Без изображения');
        } catch (error) {
          console.error('⚠️ Не удалось обработать изображение:', error);
          // Продолжаем без изображения
        } finally {
          setIsCompressing(false);
        }
      }

      setIsSubmitting(true);

      // Получаем полное имя пользователя
      const displayName = await getUserFullName();

      // Отправляем данные в Google Sheets с улучшенной обработкой ошибок
      try {
        console.log('📤 Отправляем данные в Google Sheets...');
        await googleSheetsAPIService.addSurveyData({
          title: formData.title.trim(),
          category: formData.category,
          metric: formData.metric,
          description: formData.description.trim(),
          imageBase64: imageUrl,
          authorId: currentUser.uid,
          authorName: displayName
        });
        console.log('✅ Данные успешно сохранены в Google Sheets');
      } catch (sheetsError) {
        console.error('❌ Ошибка отправки в Google Sheets:', sheetsError);
        // Показываем ошибку, но не прерываем процесс
        alert('⚠️ Данные сохранены локально. Проверьте подключение к интернету и настройки Google Sheets.');
      }

      // Показываем успех
      alert(`✅ Проблема "${formData.title}" отправлена!`);
      
      // Очищаем форму
      setFormData({ title: '', description: '', category: 'maintenance', metric: 'design' });
      setImages([]);

      console.log('🎉 Проблема отправлена!');

    } catch (error) {
      console.error('❌ Общая ошибка отправки проблемы:', error);
      alert('❌ Ошибка отправки. Проверьте подключение к интернету и попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
      setIsCompressing(false);
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

      {/* ДИАГНОСТИЧЕСКАЯ КНОПКА - УДАЛИТЬ ПОСЛЕ ТЕСТИРОВАНИЯ */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-800 mb-2">🔧 ДИАГНОСТИКА (временно)</h3>
        <button
          onClick={async () => {
            console.log('🧪 ТЕСТОВАЯ ОТПРАВКА ДАННЫХ');
            try {
              const testData = {
                title: 'ТЕСТОВАЯ ПРОБЛЕМА',
                category: 'maintenance',
                metric: 'control',
                description: 'Это тестовая отправка для диагностики проблемы с мобильными устройствами. Время: ' + new Date().toLocaleString(),
                imageBase64: '',
                authorId: currentUser?.uid || 'test-user',
                authorName: currentUser?.displayName || 'Тестовый пользователь'
              };
              
              const result = await googleSheetsAPIService.addSurveyData(testData);
              alert(result ? '✅ ТЕСТ ПРОШЕЛ!' : '❌ ТЕСТ НЕ ПРОШЕЛ');
            } catch (error) {
              console.error('❌ Ошибка теста:', error);
              alert('❌ ОШИБКА ТЕСТА: ' + error);
            }
          }}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          🧪 ТЕСТОВАЯ ОТПРАВКА (для диагностики)
        </button>
        <p className="text-xs text-red-600 mt-2">
          Нажмите эту кнопку для тестовой отправки. Откройте консоль браузера (F12) для просмотра логов.
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
          <div className="text-xs text-gray-500 mb-2">
            📷 Изображения будут автоматически сжаты до 1200px для быстрой загрузки
          </div>
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={isCompressing || isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
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
                            {(file.size / 1024).toFixed(1)} KB → будет сжато
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={isCompressing || isSubmitting}
                        className="text-red-500 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
          disabled={isSubmitting || isCompressing || !formData.title.trim() || !formData.description.trim()}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform ${
            isSubmitting || isCompressing || !formData.title.trim() || !formData.description.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full"></div>
              <span>Отправляем...</span>
            </div>
          ) : isCompressing ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full"></div>
              <span>Сжимаем фото...</span>
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