// Сервис для работы с локальными данными
export interface LocalUser {
  id: string;
  email: string;
  fullName: string;
  totalPoints: number;
  totalProblems: number;
  level: 'novice' | 'fighter' | 'master';
  joinedAt: string;
  lastActive: string;
  isAdmin?: boolean;
}

export interface LocalProblem {
  id: string;
  title: string;
  description: string;
  category: string;
  authorId: string;
  authorName: string;
  images: string[]; // Имена файлов изображений
  points: number;
  status: 'pending' | 'reviewed';
  reviewed: boolean; // Отмечена ли проблема как просмотренная админом
  reviewedAt?: string; // Дата просмотра
  reviewedBy?: string; // ID админа, который просмотрел
  createdAt: string;
  adminNotes?: string;
}

export interface PointsHistory {
  id: string;
  userId: string;
  problemId: string;
  points: number;
  reason: string;
  createdAt: string;
  adminId?: string;
}

export interface SeasonSettings {
  currentSeason: string;
  seasonStartDate: string;
  seasonEndDate: string;
  isActive: boolean;
  lastBackup: string;
}

export interface LocalDatabase {
  users: LocalUser[];
  problems: LocalProblem[];
  pointsHistory: PointsHistory[];
  settings: SeasonSettings;
}

class LocalDataService {
  private readonly DATA_PATH = '/Users/mike/Desktop/quiz/problem-tracker-data';
  private readonly UPLOADS_PATH = `${this.DATA_PATH}/uploads`;
  
  // Инициализация - создание файлов если их нет
  async initialize(): Promise<void> {
    console.log('🔧 Инициализация локальной системы данных...');
    
    // Создаем начальную структуру данных если её нет
    const initialData: LocalDatabase = {
      users: [],
      problems: [],
      pointsHistory: [],
      settings: {
        currentSeason: 'season-2024',
        seasonStartDate: new Date().toISOString(),
        seasonEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 дней
        isActive: true,
        lastBackup: new Date().toISOString(),
      }
    };

    // Сохраняем в localStorage для демонстрации
    if (!localStorage.getItem('localDatabase')) {
      localStorage.setItem('localDatabase', JSON.stringify(initialData));
    }

    // Исправляем имена пользователей если нужно
    await this.fixUserNames();

    console.log('✅ Локальная система готова!');
    console.log(`📁 Данные: ${this.DATA_PATH}`);
    console.log(`🖼️ Файлы: ${this.UPLOADS_PATH}`);
    console.log('👑 Админ: admin@mail.ru (не участвует в рейтинге)');
  }

  // Загрузка данных
  private loadData(): LocalDatabase {
    try {
      const data = localStorage.getItem('localDatabase');
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }

    // Возвращаем пустую структуру если данных нет
    return {
      users: [],
      problems: [],
      pointsHistory: [],
      settings: {
        currentSeason: 'season-2024',
        seasonStartDate: new Date().toISOString(),
        seasonEndDate: new Date().toISOString(),
        isActive: true,
        lastBackup: new Date().toISOString(),
      }
    };
  }

  // Сохранение данных
  private saveData(data: LocalDatabase): void {
    try {
      localStorage.setItem('localDatabase', JSON.stringify(data));
      
      // Также создаем JSON файл для скачивания
      this.exportToFile(data);
      
      console.log('💾 Данные сохранены локально');
    } catch (error) {
      console.error('Ошибка сохранения данных:', error);
    }
  }

  // Экспорт данных в файл
  private exportToFile(data: LocalDatabase): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Создаем ссылку для скачивания
    const a = document.createElement('a');
    a.href = url;
    a.download = `problem-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    
    console.log(`📄 JSON файл готов к скачиванию: ${a.download}`);
    
    // Автоматически не скачиваем, но готовим файл
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Сохранение изображения
  async saveImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const base64 = reader.result as string;
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}_${file.name}`;
          
          // Сохраняем в localStorage для демонстрации
          const images = JSON.parse(localStorage.getItem('localImages') || '{}');
          images[fileName] = {
            name: file.name,
            size: file.size,
            type: file.type,
            data: base64,
            savedAt: new Date().toISOString(),
            path: `${this.UPLOADS_PATH}/${fileName}`
          };
          localStorage.setItem('localImages', JSON.stringify(images));
          
          console.log(`📸 Изображение сохранено: ${fileName}`);
          console.log(`📁 Путь: ${this.UPLOADS_PATH}/${fileName}`);
          
          resolve(fileName);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Получение изображения
  async getImage(fileName: string): Promise<string | null> {
    try {
      const images = JSON.parse(localStorage.getItem('localImages') || '{}');
      return images[fileName]?.data || null;
    } catch (error) {
      console.error('Ошибка получения изображения:', error);
      return null;
    }
  }

  // Регистрация/обновление пользователя
  async saveUser(userData: Omit<LocalUser, 'totalPoints' | 'totalProblems' | 'level'>): Promise<LocalUser> {
    const data = this.loadData();
    
    let user = data.users.find(u => u.email === userData.email);
    
    if (user) {
      // Обновляем существующего пользователя (но не перезаписываем ФИО если оно уже есть)
      if (userData.fullName && userData.fullName !== 'Пользователь' && !userData.fullName.includes('@')) {
        user.fullName = userData.fullName;
      }
      user.lastActive = new Date().toISOString();
      
      // Проверяем админа
      if (userData.email === 'admin@mail.ru') {
        user.isAdmin = true;
      }
    } else {
      // Создаем нового пользователя
      user = {
        ...userData,
        totalPoints: 0,
        totalProblems: 0,
        level: 'novice',
        isAdmin: userData.email === 'admin@mail.ru', // Админ по email
      };
      data.users.push(user);
    }
    
    this.saveData(data);
    return user;
  }

  // Получение имени пользователя из Firestore или локальной базы
  async getUserDisplayName(userId: string, email: string): Promise<string> {
    try {
      // Сначала пробуем получить из Firebase/Firestore
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.fullName && data.fullName !== 'Пользователь') {
          return data.fullName;
        }
      }
    } catch (error) {
      console.log('Не удалось получить данные из Firestore:', error);
    }

    // Если не получилось из Firestore, ищем в локальной базе
    const data = this.loadData();
    const localUser = data.users.find(u => u.id === userId || u.email === email);
    
    if (localUser && localUser.fullName && localUser.fullName !== 'Пользователь' && !localUser.fullName.includes('@')) {
      return localUser.fullName;
    }

    // В крайнем случае используем часть email до @
    return email.split('@')[0];
  }

  // Исправление имен пользователей (для исправления существующих записей)
  async fixUserNames(): Promise<void> {
    const data = this.loadData();
    let hasChanges = false;
    
    // Исправляем пользователей с именем "Пользователь"
    data.users.forEach(user => {
      if (user.fullName === 'Пользователь' && user.email) {
        // Используем часть email до @ как имя
        const emailName = user.email.split('@')[0];
        user.fullName = emailName;
        hasChanges = true;
        console.log(`🔧 Исправлено имя пользователя: ${user.email} → ${emailName}`);
      }
    });

    // Исправляем проблемы с authorName "Пользователь"
    data.problems.forEach(problem => {
      if (problem.authorName === 'Пользователь') {
        const user = data.users.find(u => u.id === problem.authorId);
        if (user && user.fullName !== 'Пользователь') {
          problem.authorName = user.fullName;
          hasChanges = true;
          console.log(`🔧 Исправлено имя автора проблемы: ${problem.title} → ${user.fullName}`);
        }
      }
    });
    
    if (hasChanges) {
      this.saveData(data);
      console.log('✅ Имена пользователей исправлены');
    }
  }

  // Получение пользователя
  async getUser(userId: string): Promise<LocalUser | null> {
    const data = this.loadData();
    return data.users.find(u => u.id === userId) || null;
  }

  // Добавление проблемы
  async addProblem(problemData: Omit<LocalProblem, 'id' | 'points' | 'status' | 'reviewed' | 'createdAt'>): Promise<LocalProblem> {
    const data = this.loadData();
    
    const problem: LocalProblem = {
      ...problemData,
      id: `problem_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      points: 1, // Базовые баллы
      status: 'pending',
      reviewed: false, // По умолчанию не просмотрена
      createdAt: new Date().toISOString(),
    };
    
    data.problems.push(problem);
    
    // Обновляем статистику пользователя
    const user = data.users.find(u => u.id === problemData.authorId);
    if (user) {
      user.totalProblems += 1;
      user.totalPoints += 1;
      user.level = this.calculateLevel(user.totalPoints);
      user.lastActive = new Date().toISOString();
    }
    
    // Добавляем в историю баллов
    const historyEntry: PointsHistory = {
      id: `history_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      userId: problemData.authorId,
      problemId: problem.id,
      points: 1,
      reason: 'Базовые баллы за проблему',
      createdAt: new Date().toISOString(),
    };
    data.pointsHistory.push(historyEntry);
    
    this.saveData(data);
    console.log('✅ Проблема добавлена:', problem.title);
    
    return problem;
  }

  // Получение всех проблем
  async getProblems(): Promise<LocalProblem[]> {
    const data = this.loadData();
    return [...data.problems].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Добавление бонусных баллов
  async addBonusPoints(problemId: string, points: number, reason: string, adminId: string): Promise<void> {
    const data = this.loadData();
    
    const problem = data.problems.find(p => p.id === problemId);
    if (!problem) throw new Error('Проблема не найдена');
    
    // Обновляем баллы проблемы
    problem.points += points;
    
    // Обновляем баллы пользователя
    const user = data.users.find(u => u.id === problem.authorId);
    if (user) {
      user.totalPoints += points;
      user.level = this.calculateLevel(user.totalPoints);
    }
    
    // Добавляем в историю
    const historyEntry: PointsHistory = {
      id: `history_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      userId: problem.authorId,
      problemId: problemId,
      points: points,
      reason: reason,
      createdAt: new Date().toISOString(),
      adminId: adminId,
    };
    data.pointsHistory.push(historyEntry);
    
    this.saveData(data);
    console.log(`✅ Добавлено ${points} бонусных баллов за проблему: ${problem.title}`);
  }

  // Получение рейтинга (без админа)
  async getLeaderboard(): Promise<LocalUser[]> {
    const data = this.loadData();
    return [...data.users]
      .filter(user => !user.isAdmin) // Исключаем админа из рейтинга
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((user, index) => ({ ...user, rank: index + 1 }));
  }

  // Получение всех данных
  async getAllData(): Promise<LocalDatabase> {
    return this.loadData();
  }

  // Расчет уровня
  private calculateLevel(points: number): 'novice' | 'fighter' | 'master' {
    if (points >= 10) return 'master';
    if (points >= 5) return 'fighter';
    return 'novice';
  }

  // Экспорт данных для резервного копирования
  async exportData(): Promise<void> {
    const data = this.loadData();
    const exportData = {
      ...data,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `problem-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📦 Данные экспортированы в файл');
  }

  // Импорт данных из файла
  async importData(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const importedData = JSON.parse(reader.result as string);
          
          // Валидация данных
          if (!importedData.users || !importedData.problems) {
            throw new Error('Неверный формат файла');
          }
          
          localStorage.setItem('localDatabase', JSON.stringify(importedData));
          console.log('📥 Данные импортированы из файла');
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // Проверка является ли пользователь админом
  async isAdmin(userId: string, email: string): Promise<boolean> {
    // Только admin@mail.ru является админом
    console.log(`🔍 Проверка админа: userId=${userId}, email=${email}`);
    return email === 'admin@mail.ru';
  }

  // Управление сезоном (только для админа)
  async updateSeasonSettings(newSettings: Partial<SeasonSettings>, adminId: string, adminEmail: string): Promise<void> {
    const isAdminUser = await this.isAdmin(adminId, adminEmail);
    console.log(`🔍 updateSeasonSettings: adminId=${adminId}, adminEmail=${adminEmail}, isAdmin=${isAdminUser}`);
    if (!isAdminUser) {
      throw new Error('Доступ запрещен: только администратор может управлять сезоном');
    }

    const data = this.loadData();
    data.settings = { ...data.settings, ...newSettings };
    this.saveData(data);
    console.log('✅ Настройки сезона обновлены админом');
  }

  // Получение настроек сезона
  async getSeasonSettings(): Promise<SeasonSettings> {
    const data = this.loadData();
    return data.settings;
  }

  // Удаление пользователя (только для админа)
  async deleteUser(userId: string, adminId: string, adminEmail: string): Promise<void> {
    const isAdminUser = await this.isAdmin(adminId, adminEmail);
    console.log(`🔍 deleteUser: adminId=${adminId}, adminEmail=${adminEmail}, isAdmin=${isAdminUser}`);
    if (!isAdminUser) {
      throw new Error('Доступ запрещен: только администратор может удалять пользователей');
    }

    const data = this.loadData();
    
    // Нельзя удалить самого себя
    if (userId === adminId) {
      throw new Error('Нельзя удалить собственный аккаунт');
    }

    // Удаляем пользователя
    data.users = data.users.filter(u => u.id !== userId);
    
    // Удаляем проблемы пользователя
    data.problems = data.problems.filter(p => p.authorId !== userId);
    
    // Удаляем историю баллов пользователя
    data.pointsHistory = data.pointsHistory.filter(h => h.userId !== userId);
    
    this.saveData(data);
    console.log('✅ Пользователь удален админом');
  }

  // Сброс сезона (только для админа)
  async resetSeason(adminId: string, adminEmail: string): Promise<void> {
    const isAdminUser = await this.isAdmin(adminId, adminEmail);
    console.log(`🔍 resetSeason: adminId=${adminId}, adminEmail=${adminEmail}, isAdmin=${isAdminUser}`);
    if (!isAdminUser) {
      throw new Error('Доступ запрещен: только администратор может сбрасывать сезон');
    }

    const data = this.loadData();
    
    // Сбрасываем баллы всех пользователей
    data.users.forEach(user => {
      user.totalPoints = 0;
      user.totalProblems = 0;
      user.level = 'novice';
    });
    
    // Очищаем проблемы и историю
    data.problems = [];
    data.pointsHistory = [];
    
    // Обновляем настройки сезона
    data.settings.currentSeason = `season-${new Date().getFullYear()}-${Date.now()}`;
    data.settings.seasonStartDate = new Date().toISOString();
    data.settings.lastBackup = new Date().toISOString();
    
    this.saveData(data);
    console.log('✅ Сезон сброшен админом');
  }

  // Завершение сезона с отчетом (только для админа)
  async finishSeason(adminId: string, adminEmail: string): Promise<{ winners: LocalUser[], report: any }> {
    const isAdminUser = await this.isAdmin(adminId, adminEmail);
    console.log(`🔍 finishSeason: adminId=${adminId}, adminEmail=${adminEmail}, isAdmin=${isAdminUser}`);
    if (!isAdminUser) {
      throw new Error('Доступ запрещен: только администратор может завершать сезон');
    }

    const data = this.loadData();
    
    // Получаем финальный рейтинг
    const winners = [...data.users]
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10); // Топ-10

    // Создаем отчет
    const report = {
      seasonName: data.settings.currentSeason,
      startDate: data.settings.seasonStartDate,
      endDate: new Date().toISOString(),
      totalParticipants: data.users.length,
      totalProblems: data.problems.length,
      totalPoints: data.users.reduce((sum, user) => sum + user.totalPoints, 0),
      winners: winners.map((user, index) => ({
        rank: index + 1,
        name: user.fullName,
        points: user.totalPoints,
        problems: user.totalProblems,
        level: user.level
      })),
      finishedAt: new Date().toISOString()
    };

    // Обновляем настройки сезона
    data.settings.isActive = false;
    data.settings.seasonEndDate = new Date().toISOString();
    
    this.saveData(data);
    console.log('🏆 Сезон завершен админом');
    
    return { winners, report };
  }

  // Получение отчета о завершенном сезоне
  async getSeasonReport(): Promise<any | null> {
    const data = this.loadData();
    
    // Если сезон завершен, формируем отчет
    if (!data.settings.isActive || new Date() > new Date(data.settings.seasonEndDate)) {
      const winners = [...data.users]
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 10);

      return {
        seasonName: data.settings.currentSeason,
        startDate: data.settings.seasonStartDate,
        endDate: data.settings.seasonEndDate,
        totalParticipants: data.users.length,
        totalProblems: data.problems.length,
        totalPoints: data.users.reduce((sum, user) => sum + user.totalPoints, 0),
        winners: winners.map((user, index) => ({
          rank: index + 1,
          name: user.fullName,
          points: user.totalPoints,
          problems: user.totalProblems,
          level: user.level
        })),
        isActive: data.settings.isActive
      };
    }
    
    return null;
  }

  // Отметка проблемы как просмотренной (только для админа)
  async markProblemAsReviewed(problemId: string, adminId: string, adminEmail: string): Promise<void> {
    const isAdminUser = await this.isAdmin(adminId, adminEmail);
    console.log(`🔍 markProblemAsReviewed: adminId=${adminId}, adminEmail=${adminEmail}, isAdmin=${isAdminUser}`);
    if (!isAdminUser) {
      throw new Error('Доступ запрещен: только администратор может отмечать проблемы как просмотренные');
    }

    const data = this.loadData();
    const problem = data.problems.find(p => p.id === problemId);
    
    if (!problem) {
      throw new Error('Проблема не найдена');
    }

    // Переключаем статус просмотра
    problem.reviewed = !problem.reviewed;
    problem.reviewedAt = problem.reviewed ? new Date().toISOString() : undefined;
    problem.reviewedBy = problem.reviewed ? adminId : undefined;
    
    this.saveData(data);
    console.log(`✅ Проблема ${problem.reviewed ? 'отмечена как просмотренная' : 'снята с просмотра'}: ${problem.title}`);
  }
}

// Экспортируем единственный экземпляр
export const localDataService = new LocalDataService();

// Автоинициализация
if (typeof window !== 'undefined') {
  localDataService.initialize();
} 