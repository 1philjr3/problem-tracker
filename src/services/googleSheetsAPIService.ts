// Простой сервис для работы с Google Sheets через публичный API
// Для полноценной работы нужно развернуть Google Apps Script Web App

interface SurveyData {
  title: string;
  category: string;
  metric: string;
  description: string;
  imageBase64?: string;
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
        data.timestamp = new Date().toISOString();
      }

      // Если Web App URL не настроен, сохраняем локально
      if (!this.webAppUrl) {
        console.warn('⚠️ Google Apps Script Web App URL не настроен. Сохраняем данные локально.');
        return this.saveToLocalStorage(data);
      }

      // Отправляем POST запрос на Web App
      const response = await fetch(this.webAppUrl, {
        method: 'POST',
        mode: 'no-cors', // Для обхода CORS
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addSurvey',
          data: data
        })
      });

      console.log('✅ Данные отправлены в Google Sheets');
      return true;
    } catch (error) {
      console.error('❌ Ошибка отправки в Google Sheets:', error);
      // Fallback на локальное хранение
      return this.saveToLocalStorage(data);
    }
  }

  /**
   * Сохраняет данные в localStorage как резервный вариант
   */
  private saveToLocalStorage(data: SurveyData): boolean {
    try {
      const storageKey = 'survey_data_queue';
      const existingData = localStorage.getItem(storageKey);
      const queue = existingData ? JSON.parse(existingData) : [];
      
      queue.push(data);
      localStorage.setItem(storageKey, JSON.stringify(queue));
      
      console.log('💾 Данные сохранены локально для последующей синхронизации');
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

      for (const data of queue) {
        await this.addSurveyData(data);
      }

      // Очищаем очередь после успешной синхронизации
      localStorage.removeItem(storageKey);
      console.log('✅ Синхронизация завершена');
    } catch (error) {
      console.error('❌ Ошибка синхронизации:', error);
    }
  }

  /**
   * Получает количество несинхронизированных записей
   */
  getUnsyncedCount(): number {
    try {
      const storageKey = 'survey_data_queue';
      const existingData = localStorage.getItem(storageKey);
      
      if (!existingData) return 0;
      
      const queue = JSON.parse(existingData);
      return queue.length;
    } catch {
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
}

// Экспортируем singleton экземпляр
export const googleSheetsAPIService = new GoogleSheetsAPIService();

// Экспортируем тип
export type { SurveyData }; 