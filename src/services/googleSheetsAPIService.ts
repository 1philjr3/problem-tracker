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

interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  authorId: string;
  authorName: string;
  images: string[];
  points: number;
  status: 'pending' | 'reviewed';
  reviewed: boolean;
  createdAt: string;
  adminNotes?: string;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  totalPoints: number;
  totalProblems: number;
  level: 'novice' | 'fighter' | 'master';
  joinedAt: string;
  lastActive: string;
}

class GoogleSheetsAPIService {
  private webAppUrl: string = '';
  
  constructor() {
    // URL можно настроить через настройки
    this.webAppUrl = localStorage.getItem('googleSheetsWebAppUrl') || '';
  }

  setWebAppUrl(url: string) {
    this.webAppUrl = url;
    localStorage.setItem('googleSheetsWebAppUrl', url);
  }

  getWebAppUrl(): string {
    return this.webAppUrl;
  }

  // Добавить данные опроса
  async addSurveyData(data: SurveyData): Promise<void> {
    if (!this.webAppUrl) {
      console.warn('Google Sheets Web App URL не настроен');
      return;
    }

    try {
      const response = await fetch(this.webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addSurvey',
          data: {
            ...data,
            timestamp: data.timestamp || new Date().toISOString()
          }
        })
      });

      console.log('✅ Данные отправлены в Google Sheets');
    } catch (error) {
      console.error('❌ Ошибка отправки в Google Sheets:', error);
      throw error;
    }
  }

  // Получить все проблемы
  async getAllProblems(): Promise<Problem[]> {
    if (!this.webAppUrl) {
      console.warn('Google Sheets Web App URL не настроен');
      return [];
    }

    try {
      const response = await fetch(`${this.webAppUrl}?action=getProblems`);
      const data = await response.json();
      
      if (data.status === 'success') {
        return data.problems || [];
      }
      
      return [];
    } catch (error) {
      console.error('❌ Ошибка получения проблем из Google Sheets:', error);
      return [];
    }
  }

  // Получить всех пользователей
  async getAllUsers(): Promise<User[]> {
    if (!this.webAppUrl) {
      console.warn('Google Sheets Web App URL не настроен');
      return [];
    }

    try {
      const response = await fetch(`${this.webAppUrl}?action=getUsers`);
      const data = await response.json();
      
      if (data.status === 'success') {
        return data.users || [];
      }
      
      return [];
    } catch (error) {
      console.error('❌ Ошибка получения пользователей из Google Sheets:', error);
      return [];
    }
  }

  // Обновить данные пользователя
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    if (!this.webAppUrl) {
      console.warn('Google Sheets Web App URL не настроен');
      return;
    }

    try {
      await fetch(this.webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateUser',
          userId: userId,
          updates: updates
        })
      });

      console.log('✅ Данные пользователя обновлены в Google Sheets');
    } catch (error) {
      console.error('❌ Ошибка обновления пользователя в Google Sheets:', error);
    }
  }

  // Добавить бонусные баллы
  async addBonusPoints(problemId: string, bonusPoints: number, adminId: string): Promise<void> {
    if (!this.webAppUrl) {
      console.warn('Google Sheets Web App URL не настроен');
      return;
    }

    try {
      await fetch(this.webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addBonusPoints',
          problemId: problemId,
          bonusPoints: bonusPoints,
          adminId: adminId
        })
      });

      console.log('✅ Бонусные баллы добавлены в Google Sheets');
    } catch (error) {
      console.error('❌ Ошибка добавления бонусных баллов в Google Sheets:', error);
    }
  }

  // Проверить соединение
  async checkConnection(): Promise<boolean> {
    if (!this.webAppUrl) {
      return false;
    }

    try {
      const response = await fetch(`${this.webAppUrl}?action=ping`);
      const data = await response.json();
      return data.status === 'success';
    } catch (error) {
      console.error('❌ Ошибка проверки соединения с Google Sheets:', error);
      return false;
    }
  }

  // Синхронизировать все данные
  async syncAllData(problems: Problem[], users: User[]): Promise<void> {
    if (!this.webAppUrl) {
      console.warn('Google Sheets Web App URL не настроен');
      return;
    }

    try {
      await fetch(this.webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'syncAllData',
          problems: problems,
          users: users
        })
      });

      console.log('✅ Все данные синхронизированы с Google Sheets');
    } catch (error) {
      console.error('❌ Ошибка синхронизации данных с Google Sheets:', error);
    }
  }
}

export const googleSheetsAPIService = new GoogleSheetsAPIService(); 