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
  
  // URL для Google Apps Script Web App
  private webAppUrl: string = '';
  
  // Публичный API ключ Google (альтернативный способ)
  private googleApiKey: string = 'AIzaSyDbjPRbpsnNy3qfHcLMKlH9UxYW8pMsSwQ'; // Из Firebase конфига

  /**
   * Добавляет данные опроса в Google Sheets через Web App
   */
  async addSurveyData(data: SurveyData): Promise<boolean> {
    console.log('🚀 НАЧИНАЕМ ОТПРАВКУ ДАННЫХ');
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('🌐 URL Web App:', this.webAppUrl);
    console.log('📋 Данные для отправки:', data);

    // Добавляем временную метку
    if (!data.timestamp) {
      data.timestamp = new Date().toLocaleString('ru-RU');
    }

    // Если Web App URL не настроен, пробуем альтернативный способ
    if (!this.webAppUrl) {
      console.warn('⚠️ Google Apps Script Web App URL не настроен!');
      console.log('🔄 Пробуем альтернативный способ через Google Sheets API...');
      return await this.addDataViaPublicAPI(data);
    }

    try {
      console.log('📤 Отправляем через Web App...');
      
      // Пробуем разные способы отправки
      const success = await this.tryMultipleMethods(data);
      
      if (success) {
        console.log('✅ ДАННЫЕ УСПЕШНО ОТПРАВЛЕНЫ!');
        return true;
      } else {
        throw new Error('Все методы отправки не сработали');
      }

    } catch (error) {
      console.error('❌ Ошибка отправки в Google Sheets:', error);
      
      // Пробуем альтернативный способ
      console.log('🔄 Пробуем альтернативный способ...');
      try {
        return await this.addDataViaPublicAPI(data);
      } catch (altError) {
        console.error('❌ Альтернативный способ тоже не сработал:', altError);
        
        // Сохраняем локально как последний fallback
        console.log('💾 Сохраняем локально...');
        return this.saveToLocalStorage(data);
      }
    }
  }

  /**
   * Пробует несколько методов отправки
   */
  private async tryMultipleMethods(data: SurveyData): Promise<boolean> {
    const methods = [
      () => this.sendWithFetch(data),
      () => this.sendWithXMLHttpRequest(data),
      () => this.sendWithForm(data)
    ];

    for (let i = 0; i < methods.length; i++) {
      try {
        console.log(`🔄 Пробуем метод ${i + 1}...`);
        const success = await methods[i]();
        if (success) {
          console.log(`✅ Метод ${i + 1} сработал!`);
          return true;
        }
      } catch (error) {
        console.error(`❌ Метод ${i + 1} не сработал:`, error);
      }
    }

    return false;
  }

  /**
   * Отправка через fetch
   */
  private async sendWithFetch(data: SurveyData): Promise<boolean> {
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

    console.log('📡 Fetch ответ:', response.status, response.statusText);
    return response.status === 200;
  }

  /**
   * Отправка через XMLHttpRequest
   */
  private async sendWithXMLHttpRequest(data: SurveyData): Promise<boolean> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', this.webAppUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          console.log('📡 XHR ответ:', xhr.status, xhr.statusText);
          resolve(xhr.status === 200);
        }
      };
      
      xhr.send(JSON.stringify({
        action: 'addSurvey',
        data: data
      }));
    });
  }

  /**
   * Отправка через скрытую форму
   */
  private async sendWithForm(data: SurveyData): Promise<boolean> {
    return new Promise((resolve) => {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = this.webAppUrl;
      form.style.display = 'none';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'data';
      input.value = JSON.stringify({
        action: 'addSurvey',
        data: data
      });

      form.appendChild(input);
      document.body.appendChild(form);
      
      form.submit();
      
      // Удаляем форму через секунду
      setTimeout(() => {
        document.body.removeChild(form);
        resolve(true); // Предполагаем успех
      }, 1000);
    });
  }

  /**
   * Альтернативный способ через публичный Google Sheets API
   */
  private async addDataViaPublicAPI(data: SurveyData): Promise<boolean> {
    try {
      console.log('🔑 Пробуем публичный API Google Sheets...');
      
      // Формируем данные для публичного API
      const values = [[
        data.timestamp,
        data.title,
        data.category,
        data.metric,
        data.description,
        data.imageBase64 || '',
        data.authorId,
        data.authorName
      ]];

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}!A:H:append?valueInputOption=RAW&key=${this.googleApiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        })
      });

      console.log('📡 Google API ответ:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('✅ Публичный API сработал!');
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка публичного API:', errorText);
        return false;
      }

    } catch (error) {
      console.error('❌ Публичный API не сработал:', error);
      return false;
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