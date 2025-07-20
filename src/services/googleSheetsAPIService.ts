// Простой сервис для работы с Google Sheets через Web App

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
  private webAppUrl: string = '';

  /**
   * Добавляет данные в Google Sheets
   */
  async addSurveyData(data: SurveyData): Promise<boolean> {
    // Добавляем временную метку
    if (!data.timestamp) {
      data.timestamp = new Date().toLocaleString('ru-RU');
    }

    // Если URL не настроен, сохраняем локально
    if (!this.webAppUrl) {
      console.warn('⚠️ Web App URL не настроен');
      return this.saveToLocalStorage(data);
    }

    try {
      // Простой POST запрос
      const response = await fetch(this.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addSurvey',
          data: data
        })
      });

      if (response.ok) {
        console.log('✅ Данные отправлены');
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('❌ Ошибка отправки:', error);
      return this.saveToLocalStorage(data);
    }
  }

  /**
   * Сохраняет данные локально
   */
  private saveToLocalStorage(data: SurveyData): boolean {
    try {
      const queue = JSON.parse(localStorage.getItem('survey_data_queue') || '[]');
      queue.push(data);
      localStorage.setItem('survey_data_queue', JSON.stringify(queue));
      console.log('💾 Сохранено локально');
      return true;
    } catch (error) {
      console.error('❌ Ошибка локального сохранения:', error);
      return false;
    }
  }

  /**
   * Синхронизация локальных данных
   */
  async syncLocalData(): Promise<void> {
    if (!this.webAppUrl) return;

    try {
      const queue = JSON.parse(localStorage.getItem('survey_data_queue') || '[]');
      if (queue.length === 0) return;

      for (const data of queue) {
        await this.addSurveyData(data);
      }

      localStorage.removeItem('survey_data_queue');
      console.log('✅ Синхронизация завершена');
    } catch (error) {
      console.error('❌ Ошибка синхронизации:', error);
    }
  }

  /**
   * Количество несинхронизированных записей
   */
  getUnsyncedCount(): number {
    try {
      const queue = JSON.parse(localStorage.getItem('survey_data_queue') || '[]');
      return queue.length;
    } catch {
      return 0;
    }
  }

  /**
   * Настройка URL Web App
   */
  setWebAppUrl(url: string): void {
    this.webAppUrl = url;
    console.log('✅ Web App URL настроен');
  }
}

export const googleSheetsAPIService = new GoogleSheetsAPIService();
export type { SurveyData }; 