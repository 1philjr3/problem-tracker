import React, { useState } from 'react';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { CATEGORIES } from '../../types/index';

export default function SubmitProblemPage() {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + images.length > 5) {
        setError('Максимум 5 изображений');
        return;
      }
      setImages(prev => [...prev, ...files]);
      setError('');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Сохраняем изображения
      const imageNames: string[] = [];
      for (const image of images) {
        try {
          const imageName = await dataService.saveImage(image);
          imageNames.push(imageName);
        } catch (err) {
          console.error('Ошибка сохранения изображения:', err);
        }
      }
      
      // Получаем имя пользователя
      const displayName = await dataService.getUserDisplayName(
        currentUser.uid,
        currentUser.email || ''
      );
      
      // Сохраняем пользователя если нужно
      await dataService.saveUser({
        id: currentUser.uid,
        email: currentUser.email || '',
        fullName: displayName,
        isEmailVerified: currentUser.emailVerified,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      });
      
      // Добавляем проблему
      const problem = await dataService.addProblem({
        title,
        description,
        category,
        authorId: currentUser.uid,
        authorName: displayName,
        images: imageNames
      });
      
      console.log('Проблема добавлена:', problem);
      
      // Очищаем форму
      setTitle('');
      setDescription('');
      setCategory('other');
      setImages([]);
      setSubmitSuccess(true);
      
      // Скрываем сообщение об успехе через 5 секунд
      setTimeout(() => setSubmitSuccess(false), 5000);
      
    } catch (err) {
      console.error('Ошибка отправки проблемы:', err);
      setError(err instanceof Error ? err.message : 'Ошибка отправки проблемы');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Отправить проблему</h1>
      
      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-800">
              Проблема успешно отправлена! Вам начислен 1 балл.
            </p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Название проблемы *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Краткое описание проблемы"
          />
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Категория *
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <option key={key} value={key}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Описание *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Подробное описание проблемы, где обнаружена, как воспроизвести и т.д."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Изображения (максимум 5)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Загрузить файлы</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={images.length >= 5}
                  />
                </label>
                <p className="pl-1">или перетащите сюда</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF до 10MB</p>
            </div>
          </div>
          
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Превью ${index + 1}`}
                    className="h-24 w-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Отправка...' : 'Отправить проблему (+1 балл)'}
          </button>
        </div>
      </form>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Подсказка:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• За каждую отправленную проблему вы получаете 1 балл</li>
          <li>• Администратор может добавить до 10 бонусных баллов за важные находки</li>
          <li>• Прикрепляйте фотографии для лучшего понимания проблемы</li>
          <li>• Файлы сохраняются в облаке Firebase</li>
        </ul>
      </div>
    </div>
  );
} 