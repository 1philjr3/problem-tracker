// Локальная база данных через JSON файлы
import type { Problem, User, Season, PointsHistory } from '../types';

// Путь к папке с данными (создается автоматически)
const DATA_FOLDER = '/Users/mike/Desktop/quiz/problem-tracker-data';
const UPLOADS_FOLDER = `${DATA_FOLDER}/uploads`;

// История начисления баллов
export interface PointsHistory {
  id: string;
  userId: string;
  problemId: string;
  points: number;
  reason: string; // Причина начисления (базовые баллы, бонус от админа и т.д.)
  createdAt: string;
  seasonId: string;
  adminId?: string; // ID админа, если баллы добавлены вручную
}

// Структура локальной базы данных
interface LocalDatabase {
  problems: Problem[];
  users: User[];
  seasons: Season[];
  pointsHistory: PointsHistory[];
  settings: {
    currentSeason: string;
    autoBackup: boolean;
    lastBackup: string;
  };
}

// Инициализация пустой базы данных
const EMPTY_DATABASE: LocalDatabase = {
  problems: [],
  users: [],
  seasons: [
    {
      id: 'season-2024',
      name: 'Сезон 2024',
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-12-31T23:59:59.000Z',
      isActive: true,
      totalProblems: 0,
      totalParticipants: 0,
      createdAt: new Date().toISOString(),
    }
  ],
  pointsHistory: [],
  settings: {
    currentSeason: 'season-2024',
    autoBackup: true,
    lastBackup: new Date().toISOString(),
  }
};

class LocalDatabaseService {
  private database: LocalDatabase = EMPTY_DATABASE;
  private isInitialized = false;

  // Инициализация - создание папок и файлов
  async initialize(): Promise<void> {
    try {
      console.log('🔧 Инициализация локальной базы данных...');
      
      // Создаем папки если их нет
      await this.createDirectories();
      
      // Загружаем существующую базу или создаем новую
      await this.loadDatabase();
      
      this.isInitialized = true;
      console.log('✅ Локальная база данных готова!');
      console.log(`📁 Данные: ${DATA_FOLDER}`);
      console.log(`🖼️ Файлы: ${UPLOADS_FOLDER}`);
      
    } catch (error) {
      console.error('❌ Ошибка инициализации базы данных:', error);
      // Fallback - работаем в памяти
      this.database = EMPTY_DATABASE;
      this.isInitialized = true;
    }
  }

  // Создание директорий
  private async createDirectories(): Promise<void> {
    try {
      // В браузере используем localStorage для имитации
      if (typeof window !== 'undefined') {
        // Браузерная версия - используем localStorage
        return;
      }
      
      // Node.js версия (для будущего расширения)
      const fs = await import('fs');
      const path = await import('path');
      
      if (!fs.existsSync(DATA_FOLDER)) {
        fs.mkdirSync(DATA_FOLDER, { recursive: true });
      }
      
      if (!fs.existsSync(UPLOADS_FOLDER)) {
        fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
      }
      
    } catch (error) {
      console.log('📱 Браузерная версия - используем localStorage');
    }
  }

  // Загрузка базы данных
  private async loadDatabase(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // Браузерная версия
        const stored = localStorage.getItem('problem-tracker-db');
        if (stored) {
          this.database = JSON.parse(stored);
          console.log('✅ База данных загружена из localStorage');
        } else {
          this.database = EMPTY_DATABASE;
          await this.saveDatabase();
          console.log('✅ Создана новая база данных');
        }
      }
    } catch (error) {
      console.error('⚠️ Ошибка загрузки базы данных, используем пустую:', error);
      this.database = EMPTY_DATABASE;
    }
  }

  // Сохранение базы данных
  private async saveDatabase(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // Браузерная версия
        localStorage.setItem('problem-tracker-db', JSON.stringify(this.database));
        console.log('💾 База данных сохранена в localStorage');
        
        // Также выводим JSON для ручного сохранения
        console.log('📄 JSON для сохранения на компьютер:');
        console.log(JSON.stringify(this.database, null, 2));
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения базы данных:', error);
    }
  }

  // Сохранение изображения локально
  async saveImage(file: File): Promise<string> {
    try {
      // Создаем уникальное имя файла
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `${timestamp}_${randomId}.${extension}`;
      
      if (typeof window !== 'undefined') {
        // В браузере сохраняем как base64 для демонстрации
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            
            // Сохраняем в localStorage для демонстрации
            const images = JSON.parse(localStorage.getItem('problem-tracker-images') || '{}');
            images[fileName] = {
              name: file.name,
              size: file.size,
              type: file.type,
              data: base64,
              savedAt: new Date().toISOString()
            };
            localStorage.setItem('problem-tracker-images', JSON.stringify(images));
            
            console.log(`💾 Изображение сохранено: ${fileName}`);
            console.log(`📁 Путь: ${UPLOADS_FOLDER}/${fileName}`);
            
            resolve(fileName);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      
      return fileName;
    } catch (error) {
      console.error('❌ Ошибка сохранения изображения:', error);
      throw error;
    }
  }

  // Получение изображения
  async getImage(fileName: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined') {
        const images = JSON.parse(localStorage.getItem('problem-tracker-images') || '{}');
        return images[fileName]?.data || null;
      }
      return null;
    } catch (error) {
      console.error('❌ Ошибка получения изображения:', error);
      return null;
    }
  }

  // CRUD операции для проблем
  async addProblem(problem: Omit<Problem, 'id'>): Promise<Problem> {
    const newProblem: Problem = {
      ...problem,
      id: `problem_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    };
    
    this.database.problems.push(newProblem);
    await this.saveDatabase();
    
    console.log('✅ Проблема добавлена:', newProblem.title);
    return newProblem;
  }

  async getProblems(): Promise<Problem[]> {
    return [...this.database.problems];
  }

  async updateProblem(id: string, updates: Partial<Problem>): Promise<Problem | null> {
    const index = this.database.problems.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    this.database.problems[index] = { ...this.database.problems[index], ...updates };
    await this.saveDatabase();
    
    console.log('✅ Проблема обновлена:', id);
    return this.database.problems[index];
  }

  // Добавление бонусных баллов (для админа)
  async addBonusPoints(problemId: string, points: number, reason: string): Promise<void> {
    const problem = this.database.problems.find(p => p.id === problemId);
    if (!problem) throw new Error('Проблема не найдена');
    
    // Обновляем баллы проблемы
    problem.points += points;
    
    // Добавляем в историю
    const historyEntry: PointsHistory = {
      id: `history_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      userId: problem.authorId,
      problemId: problemId,
      points: points,
      reason: reason,
      createdAt: new Date().toISOString(),
      seasonId: this.database.settings.currentSeason,
    };
    
    this.database.pointsHistory.push(historyEntry);
    
    // Обновляем общие баллы пользователя
    const user = this.database.users.find(u => u.id === problem.authorId);
    if (user) {
      user.totalPoints += points;
      user.level = this.calculateLevel(user.totalPoints);
    }
    
    await this.saveDatabase();
    console.log(`✅ Добавлено ${points} бонусных баллов за проблему: ${problem.title}`);
  }

  // Расчет уровня пользователя
  private calculateLevel(points: number): 'novice' | 'fighter' | 'master' {
    if (points >= 10) return 'master';
    if (points >= 5) return 'fighter';
    return 'novice';
  }

  // Получение статистики для админки
  async getAdminStats() {
    return {
      totalProblems: this.database.problems.length,
      totalUsers: this.database.users.length,
      totalPoints: this.database.pointsHistory.reduce((sum, h) => sum + h.points, 0),
      recentProblems: this.database.problems
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
      topUsers: this.database.users
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 10),
    };
  }

  // Экспорт данных для резервного копирования
  async exportData(): Promise<string> {
    const exportData = {
      ...this.database,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Скачиваем файл в браузере
    if (typeof window !== 'undefined') {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `problem-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    console.log('📦 Данные экспортированы');
    return jsonString;
  }

  // Получение всех данных (для отладки)
  async getAllData(): Promise<LocalDatabase> {
    return { ...this.database };
  }
}

// Синглтон экземпляр
export const localDB = new LocalDatabaseService();

// Автоинициализация
if (typeof window !== 'undefined') {
  localDB.initialize();
} 