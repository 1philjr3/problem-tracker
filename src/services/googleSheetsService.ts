import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Интерфейс для данных опроса
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

class GoogleSheetsService {
  private sheets: any;
  private auth: OAuth2Client | null = null;
  private spreadsheetId: string = '1PHrQ8ZwjrOc4_9QuvpQltuMpuSUGIlcb96lp6korbTA';
  private sheetName: string = 'Лист1';

  constructor() {
    // Инициализация будет выполняться асинхронно
  }

  /**
   * Инициализация сервиса с аутентификацией
   * Использует Service Account для аутентификации
   */
  async initialize(): Promise<void> {
    try {
      // Вариант 1: Использование Service Account (рекомендуется для серверного приложения)
      // Для этого нужно создать Service Account в Google Cloud Console
      // и добавить его email в доступ к таблице
      
      // Временно используем API ключ для простоты
      // В продакшене лучше использовать Service Account
      this.auth = new google.auth.OAuth2();
      
      // Инициализируем Google Sheets API
      this.sheets = google.sheets({ 
        version: 'v4',
        auth: this.auth
      });
      
      console.log('✅ Google Sheets сервис инициализирован');
    } catch (error) {
      console.error('❌ Ошибка инициализации Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Добавляет новую строку с данными опроса в таблицу
   */
  async addSurveyData(data: SurveyData): Promise<boolean> {
    try {
      // Добавляем временную метку, если её нет
      if (!data.timestamp) {
        data.timestamp = new Date().toISOString();
      }

      // Подготавливаем данные для вставки
      const values = [[
        data.timestamp,
        data.title,
        data.category,
        data.metric,
        data.description,
        data.imageBase64 || '',
        data.authorId || '',
        data.authorName || ''
      ]];

      // Вставляем данные в таблицу
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:H`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: values
        }
      });

      console.log('✅ Данные успешно добавлены в Google Sheets:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Ошибка добавления данных в Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Получает все данные опросов из таблицы
   */
  async getAllSurveys(): Promise<SurveyData[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A2:H`, // Начинаем со второй строки (первая - заголовки)
      });

      const rows = response.data.values || [];
      
      return rows.map((row: any[]) => ({
        timestamp: row[0] || '',
        title: row[1] || '',
        category: row[2] || '',
        metric: row[3] || '',
        description: row[4] || '',
        imageBase64: row[5] || '',
        authorId: row[6] || '',
        authorName: row[7] || ''
      }));
    } catch (error) {
      console.error('❌ Ошибка получения данных из Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Создает заголовки столбцов на листе
   */
  async createHeaders(): Promise<void> {
    try {
      const headers = [
        ['Временная метка', 'Название', 'Категория', 'Метрика', 'Описание', 'Фото (base64)', 'ID автора', 'Имя автора']
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1:H1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: headers
        }
      });

      console.log('✅ Заголовки созданы в Google Sheets');
    } catch (error) {
      console.error('❌ Ошибка создания заголовков:', error);
      throw error;
    }
  }

  /**
   * Проверяет доступность таблицы
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      
      console.log('✅ Подключение к Google Sheets успешно:', response.data.properties.title);
      return true;
    } catch (error) {
      console.error('❌ Ошибка подключения к Google Sheets:', error);
      return false;
    }
  }
}

// Экспортируем singleton экземпляр
export const googleSheetsService = new GoogleSheetsService();

// Экспортируем тип для использования в других модулях
export type { SurveyData }; 