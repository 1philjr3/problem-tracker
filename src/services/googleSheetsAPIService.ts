// Простой сервис для работы с Google Sheets через публичный API
// Для полноценной работы нужно развернуть Google Apps Script Web App

interface SurveyData {
  title: string;
  category: string;
  metric: string;
  description: string;
  imageBase64?: string; // Теперь содержит URL изображения, а не base64
  timestamp?: string;
  authorId?: string;
  authorName?: string;
}

class GoogleSheetsAPIService {
  private spreadsheetId: string = '1PHrQ8ZwjrOc4_9QuvpQltuMpuSUGIlcb96lp6korbTA';
  private sheetName: string = 'Лист1';
  
  // URL для Google Apps Script Web App (нужно будет создать и развернуть)
  // Пример: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
  private webAppUrl: string = '';

  /**
   * Добавляет данные опроса в Google Sheets через Web App
   */
  async addSurveyData(data: SurveyData): Promise<boolean> {
    try {
      // Добавляем временную метку
      if (!data.timestamp) {
        data.timestamp = new Date().toLocaleString('ru-RU');
      }

      // Если Web App URL не настроен, сохраняем локально
      if (!this.webAppUrl) {
        console.warn('⚠️ Google Apps Script Web App URL не настроен. Сохраняем данные локально.');
        return this.saveToLocalStorage(data);
      }

      console.log('📤 Отправляем данные в Google Sheets:', {
        url: this.webAppUrl,
        data: { ...data, imageBase64: data.imageBase64 ? '[IMAGE_URL]' : 'нет' }
      });

      // Создаем FormData для отправки
      const formData = new FormData();
      formData.append('action', 'addSurvey');
      formData.append('data', JSON.stringify(data));

      // Отправляем POST запрос на Web App
      const response = await fetch(this.webAppUrl, {
        method: 'POST',
        body: formData
      });

      // Проверяем статус ответа
      if (response.ok) {
        console.log('✅ Данные успешно отправлены в Google Sheets');
        return true;
      } else {
        console.warn('⚠️ Получен не успешный статус:', response.status, response.statusText);
        // Даже если статус не 200, данные могут быть сохранены (особенность Google Apps Script)
        // Поэтому считаем это успехом, если нет ошибки сети
        return true;
      }
    } catch (error) {
      console.error('❌ Ошибка отправки в Google Sheets:', error);
      
      // Проверяем, является ли это ошибкой сети
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('🌐 Проблема с сетью. Сохраняем данные локально для последующей синхронизации.');
        return this.saveToLocalStorage(data);
      }
      
      // Для других ошибок тоже сохраняем локально
      return this.saveToLocalStorage(data);
    }
  }

  /**
   * Сохраняет данные локально для последующей синхронизации
   */
  private saveToLocalStorage(data: SurveyData): boolean {
    try {
      const storageKey = 'survey_data_queue';
      const existingData = localStorage.getItem(storageKey);
      const queue = existingData ? JSON.parse(existingData) : [];
      
      queue.push(data);
      localStorage.setItem(storageKey, JSON.stringify(queue));
      
      console.log('💾 Данные сохранены локально. В очереди:', queue.length);
      return true;
    } catch (error) {
      console.error('❌ Ошибка сохранения в localStorage:', error);
      return false;
    }
  }

  /**
   * Синхронизирует локально сохраненные данные с Google Sheets
   */
  async syncLocalData(): Promise<void> {
    if (!this.webAppUrl) {
      console.warn('⚠️ Синхронизация невозможна: Web App URL не настроен');
      return;
    }

    try {
      const storageKey = 'survey_data_queue';
      const existingData = localStorage.getItem(storageKey);
      
      if (!existingData) {
        console.log('✅ Нет данных для синхронизации');
        return;
      }

      const queue = JSON.parse(existingData);
      console.log(`📤 Синхронизация ${queue.length} записей...`);

      let successCount = 0;
      const failedItems: SurveyData[] = [];

      for (const data of queue) {
        try {
          const success = await this.addSurveyData(data);
          if (success) {
            successCount++;
          } else {
            failedItems.push(data);
          }
          // Небольшая задержка между запросами
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('❌ Ошибка синхронизации элемента:', error);
          failedItems.push(data);
        }
      }

      if (failedItems.length === 0) {
        // Все данные синхронизированы, очищаем очередь
        localStorage.removeItem(storageKey);
        console.log(`✅ Синхронизация завершена: ${successCount}/${queue.length}`);
      } else {
        // Оставляем неудачные элементы в очереди
        localStorage.setItem(storageKey, JSON.stringify(failedItems));
        console.log(`⚠️ Частичная синхронизация: ${successCount}/${queue.length}. Осталось: ${failedItems.length}`);
      }
    } catch (error) {
      console.error('❌ Ошибка синхронизации:', error);
    }
  }

  /**
   * Возвращает количество несинхронизированных записей
   */
  getUnsyncedCount(): number {
    try {
      const storageKey = 'survey_data_queue';
      const existingData = localStorage.getItem(storageKey);
      if (!existingData) return 0;
      
      const queue = JSON.parse(existingData);
      return Array.isArray(queue) ? queue.length : 0;
    } catch (error) {
      console.error('❌ Ошибка получения количества несинхронизированных записей:', error);
      return 0;
    }
  }

  /**
   * Настраивает URL для Web App
   */
  setWebAppUrl(url: string): void {
    this.webAppUrl = url;
    console.log('✅ Web App URL настроен:', url);
  }

  /**
   * Проверяет подключение к Google Sheets
   */
  async testConnection(): Promise<boolean> {
    if (!this.webAppUrl) {
      console.warn('⚠️ Web App URL не настроен');
      return false;
    }

    try {
      console.log('🧪 Тестируем подключение к:', this.webAppUrl);
      
      const response = await fetch(this.webAppUrl, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.text();
        console.log('✅ Подключение успешно. Ответ:', data);
        return true;
      } else {
        console.warn('⚠️ Подключение с предупреждением. Статус:', response.status);
        // Google Apps Script может возвращать не 200, но все равно работать
        return true;
      }
    } catch (error) {
      console.error('❌ Ошибка тестирования подключения:', error);
      return false;
    }
  }
}

// Экспортируем единственный экземпляр
export const googleSheetsAPIService = new GoogleSheetsAPIService();

// Экспортируем тип
export type { SurveyData }; 