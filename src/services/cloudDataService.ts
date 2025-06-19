import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Импортируем типы из localDataService для совместимости
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
  images: string[]; // base64 строки для совместимости
  points: number;
  status: 'pending' | 'reviewed';
  reviewed: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
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

class CloudDataService {
  // Коллекции Firestore
  private readonly USERS_COLLECTION = 'users';
  private readonly PROBLEMS_COLLECTION = 'problems';
  private readonly SETTINGS_COLLECTION = 'settings';
  private readonly POINTS_HISTORY_COLLECTION = 'pointsHistory';

  // Инициализация
  async initialize(): Promise<void> {
    console.log('🔧 Инициализация облачной системы данных...');
    
    // Создаем начальные настройки если их нет
    try {
      const settingsRef = doc(db, this.SETTINGS_COLLECTION, 'current');
      const settingsSnap = await getDoc(settingsRef);
      
      if (!settingsSnap.exists()) {
        const initialSettings: SeasonSettings = {
          currentSeason: 'season-2024',
          seasonStartDate: new Date().toISOString(),
          seasonEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          lastBackup: new Date().toISOString(),
        };
        
        await setDoc(settingsRef, initialSettings);
        console.log('📝 Созданы начальные настройки сезона');
      }
    } catch (error) {
      console.error('Ошибка инициализации настроек:', error);
    }

    console.log('✅ Облачная система готова!');
    console.log('☁️ База данных: Firebase Firestore');
    console.log('👑 Админ: admin@mail.ru (не участвует в рейтинге)');
  }

  // Сохранение изображения (как base64)
  async saveImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const base64 = reader.result as string;
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}_${file.name}`;
          
          console.log(`📸 Изображение обработано: ${fileName}`);
          
          // Возвращаем base64 строку как имя файла для совместимости
          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Получение изображения (для совместимости)
  async getImage(fileName: string): Promise<string | null> {
    // В нашем случае fileName уже является base64 строкой
    return fileName;
  }

  // Регистрация/обновление пользователя
  async saveUser(userData: Omit<LocalUser, 'totalPoints' | 'totalProblems' | 'level'>): Promise<LocalUser> {
    try {
      const userRef = doc(db, this.USERS_COLLECTION, userData.id);
      const userSnap = await getDoc(userRef);
      
      let user: LocalUser;
      
      if (userSnap.exists()) {
        const existingUser = userSnap.data() as LocalUser;
        
        // Обновляем существующего пользователя
        user = {
          ...existingUser,
          ...userData,
          lastActive: new Date().toISOString(),
          isAdmin: userData.email === 'admin@mail.ru'
        };
        
        // Если есть новое ФИО, обновляем
        if (userData.fullName && userData.fullName !== 'Пользователь' && !userData.fullName.includes('@')) {
          user.fullName = userData.fullName;
        }
      } else {
        // Создаем нового пользователя
        user = {
          ...userData,
          totalPoints: 0,
          totalProblems: 0,
          level: 'novice',
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          isAdmin: userData.email === 'admin@mail.ru'
        };
      }
      
      await setDoc(userRef, user);
      console.log('✅ Пользователь сохранен:', user.email);
      
      return user;
    } catch (error) {
      console.error('Ошибка сохранения пользователя:', error);
      throw error;
    }
  }

  // Получение имени пользователя
  async getUserDisplayName(userId: string, email: string): Promise<string> {
    try {
      const userRef = doc(db, this.USERS_COLLECTION, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data() as LocalUser;
        if (userData.fullName && userData.fullName !== 'Пользователь' && !userData.fullName.includes('@')) {
          return userData.fullName;
        }
      }
      
      // В крайнем случае используем часть email до @
      return email.split('@')[0];
    } catch (error) {
      console.error('Ошибка получения имени пользователя:', error);
      return email.split('@')[0];
    }
  }

  // Исправление имен пользователей
  async fixUserNames(): Promise<void> {
    try {
      const usersQuery = query(collection(db, this.USERS_COLLECTION));
      const usersSnapshot = await getDocs(usersQuery);
      
      const batch = writeBatch(db);
      let hasChanges = false;
      
      usersSnapshot.docs.forEach(userDoc => {
        const user = userDoc.data() as LocalUser;
        
        if (user.fullName === 'Пользователь' && user.email) {
          const emailName = user.email.split('@')[0];
          batch.update(userDoc.ref, { fullName: emailName });
          hasChanges = true;
          console.log(`🔧 Исправлено имя пользователя: ${user.email} → ${emailName}`);
        }
      });
      
      if (hasChanges) {
        await batch.commit();
        console.log('✅ Имена пользователей исправлены');
      }
    } catch (error) {
      console.error('Ошибка исправления имен:', error);
    }
  }

  // Получение пользователя
  async getUser(userId: string): Promise<LocalUser | null> {
    try {
      const userRef = doc(db, this.USERS_COLLECTION, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data() as LocalUser;
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка получения пользователя:', error);
      return null;
    }
  }

  // Добавление проблемы
  async addProblem(problemData: Omit<LocalProblem, 'id' | 'points' | 'status' | 'reviewed' | 'createdAt'>): Promise<LocalProblem> {
    try {
      const problem: Omit<LocalProblem, 'id'> = {
        ...problemData,
        points: 1,
        status: 'pending',
        reviewed: false,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, this.PROBLEMS_COLLECTION), problem);
      
      // Обновляем статистику пользователя
      await this.updateUserStats(problemData.authorId, 1, 1);
      
      // Добавляем в историю баллов
      await this.addPointsHistory(problemData.authorId, docRef.id, 1, 'Базовые баллы за проблему');

      const finalProblem: LocalProblem = {
        id: docRef.id,
        ...problem
      };

      console.log('✅ Проблема добавлена:', finalProblem.title);
      return finalProblem;
    } catch (error) {
      console.error('Ошибка добавления проблемы:', error);
      throw error;
    }
  }

  // Получение всех проблем
  async getProblems(): Promise<LocalProblem[]> {
    try {
      const q = query(
        collection(db, this.PROBLEMS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LocalProblem));
    } catch (error) {
      console.error('Ошибка получения проблем:', error);
      return [];
    }
  }

  // Добавление бонусных баллов
  async addBonusPoints(problemId: string, points: number, reason: string, adminId: string): Promise<void> {
    try {
      const problemRef = doc(db, this.PROBLEMS_COLLECTION, problemId);
      const problemSnap = await getDoc(problemRef);
      
      if (!problemSnap.exists()) {
        throw new Error('Проблема не найдена');
      }

      const problemData = problemSnap.data() as LocalProblem;
      
      // Обновляем баллы проблемы
      await updateDoc(problemRef, {
        points: problemData.points + points
      });

      // Обновляем баллы пользователя
      await this.updateUserStats(problemData.authorId, points, 0);
      
      // Добавляем в историю
      await this.addPointsHistory(problemData.authorId, problemId, points, reason, adminId);

      console.log(`✅ Добавлено ${points} бонусных баллов за проблему: ${problemData.title}`);
    } catch (error) {
      console.error('Ошибка добавления бонусных баллов:', error);
      throw error;
    }
  }

  // Получение рейтинга (без админа)
  async getLeaderboard(): Promise<LocalUser[]> {
    try {
      const q = query(
        collection(db, this.USERS_COLLECTION),
        where('totalPoints', '>', 0),
        orderBy('totalPoints', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs
        .map(doc => doc.data() as LocalUser)
        .filter(user => !user.isAdmin) // Исключаем админа
        .map((user, index) => ({ ...user, rank: index + 1 }));
    } catch (error) {
      console.error('Ошибка получения рейтинга:', error);
      return [];
    }
  }

  // Получение всех данных
  async getAllData(): Promise<LocalDatabase> {
    try {
      const [users, problems, pointsHistory, settings] = await Promise.all([
        this.getAllUsers(),
        this.getProblems(),
        this.getPointsHistory(),
        this.getSeasonSettings()
      ]);

      return {
        users,
        problems,
        pointsHistory,
        settings
      };
    } catch (error) {
      console.error('Ошибка получения всех данных:', error);
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
  }

  // Экспорт данных
  async exportData(): Promise<void> {
    try {
      const data = await this.getAllData();
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
      
      console.log('📦 Данные экспортированы из Firebase');
    } catch (error) {
      console.error('Ошибка экспорта данных:', error);
    }
  }

  // Проверка является ли пользователь админом
  async isAdmin(userId: string, email: string): Promise<boolean> {
    console.log(`🔍 Проверка админа: userId=${userId}, email=${email}`);
    return email === 'admin@mail.ru';
  }

  // Управление сезоном
  async updateSeasonSettings(newSettings: Partial<SeasonSettings>, adminId: string, adminEmail: string): Promise<void> {
    const isAdminUser = await this.isAdmin(adminId, adminEmail);
    console.log(`🔍 updateSeasonSettings: adminId=${adminId}, adminEmail=${adminEmail}, isAdmin=${isAdminUser}`);
    
    if (!isAdminUser) {
      throw new Error('Доступ запрещен: только администратор может управлять сезоном');
    }

    try {
      const settingsRef = doc(db, this.SETTINGS_COLLECTION, 'current');
      await updateDoc(settingsRef, newSettings);
      console.log('✅ Настройки сезона обновлены админом');
    } catch (error) {
      console.error('Ошибка обновления настроек сезона:', error);
      throw error;
    }
  }

  // Получение настроек сезона
  async getSeasonSettings(): Promise<SeasonSettings> {
    try {
      const settingsRef = doc(db, this.SETTINGS_COLLECTION, 'current');
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        return settingsSnap.data() as SeasonSettings;
      } else {
        // Создаем настройки по умолчанию
        const defaultSettings: SeasonSettings = {
          currentSeason: 'season-2024',
          seasonStartDate: new Date().toISOString(),
          seasonEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          lastBackup: new Date().toISOString(),
        };
        
        await setDoc(settingsRef, defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error('Ошибка получения настроек сезона:', error);
      return {
        currentSeason: 'season-2024',
        seasonStartDate: new Date().toISOString(),
        seasonEndDate: new Date().toISOString(),
        isActive: true,
        lastBackup: new Date().toISOString(),
      };
    }
  }

  // Удаление пользователя
  async deleteUser(userId: string, adminId: string, adminEmail: string): Promise<void> {
    const isAdminUser = await this.isAdmin(adminId, adminEmail);
    console.log(`🔍 deleteUser: adminId=${adminId}, adminEmail=${adminEmail}, isAdmin=${isAdminUser}`);
    
    if (!isAdminUser) {
      throw new Error('Доступ запрещен: только администратор может удалять пользователей');
    }

    if (userId === adminId) {
      throw new Error('Нельзя удалить собственный аккаунт');
    }

    try {
      const batch = writeBatch(db);

      // Удаляем все проблемы пользователя
      const problemsQuery = query(
        collection(db, this.PROBLEMS_COLLECTION),
        where('authorId', '==', userId)
      );
      const problemsSnapshot = await getDocs(problemsQuery);
      
      problemsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Удаляем историю баллов пользователя
      const historyQuery = query(
        collection(db, this.POINTS_HISTORY_COLLECTION),
        where('userId', '==', userId)
      );
      const historySnapshot = await getDocs(historyQuery);
      
      historySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Удаляем пользователя
      const userRef = doc(db, this.USERS_COLLECTION, userId);
      batch.delete(userRef);

      await batch.commit();
      console.log('✅ Пользователь удален админом');
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      throw error;
    }
  }

  // Сброс сезона
  async resetSeason(adminId: string, adminEmail: string): Promise<void> {
    const isAdminUser = await this.isAdmin(adminId, adminEmail);
    console.log(`🔍 resetSeason: adminId=${adminId}, adminEmail=${adminEmail}, isAdmin=${isAdminUser}`);
    
    if (!isAdminUser) {
      throw new Error('Доступ запрещен: только администратор может сбрасывать сезон');
    }

    try {
      const batch = writeBatch(db);

      // Сбрасываем все проблемы
      const problemsQuery = query(collection(db, this.PROBLEMS_COLLECTION));
      const problemsSnapshot = await getDocs(problemsQuery);
      problemsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Сбрасываем историю баллов
      const historyQuery = query(collection(db, this.POINTS_HISTORY_COLLECTION));
      const historySnapshot = await getDocs(historyQuery);
      historySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Сбрасываем статистику пользователей
      const usersQuery = query(collection(db, this.USERS_COLLECTION));
      const usersSnapshot = await getDocs(usersQuery);
      usersSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          totalPoints: 0,
          totalProblems: 0,
          level: 'novice'
        });
      });

      await batch.commit();
      console.log('✅ Сезон сброшен админом');
    } catch (error) {
      console.error('Ошибка сброса сезона:', error);
      throw error;
    }
  }

  // Завершение сезона
  async finishSeason(adminId: string, adminEmail: string): Promise<{ winners: LocalUser[], report: any }> {
    const isAdminUser = await this.isAdmin(adminId, adminEmail);
    console.log(`🔍 finishSeason: adminId=${adminId}, adminEmail=${adminEmail}, isAdmin=${isAdminUser}`);
    
    if (!isAdminUser) {
      throw new Error('Доступ запрещен: только администратор может завершать сезон');
    }

    try {
      const leaderboard = await this.getLeaderboard();
      const winners = leaderboard.slice(0, 3); // Топ-3

      const report = {
        finishedAt: new Date().toISOString(),
        totalParticipants: leaderboard.length,
        totalProblems: (await this.getProblems()).length,
        winners: winners.map(user => ({
          name: user.fullName,
          points: user.totalPoints,
          problems: user.totalProblems
        }))
      };

      // Обновляем настройки сезона
      await this.updateSeasonSettings({
        isActive: false,
        lastBackup: new Date().toISOString()
      }, adminId, adminEmail);

      console.log('✅ Сезон завершен админом');
      return { winners, report };
    } catch (error) {
      console.error('Ошибка завершения сезона:', error);
      throw error;
    }
  }

  // Получение отчета по сезону
  async getSeasonReport(): Promise<any | null> {
    try {
      const [users, problems] = await Promise.all([
        this.getLeaderboard(),
        this.getProblems()
      ]);

      return {
        totalParticipants: users.length,
        totalProblems: problems.length,
        topUsers: users.slice(0, 5),
        categoriesStats: this.calculateCategoriesStats(problems),
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Ошибка получения отчета:', error);
      return null;
    }
  }

  // Отметка проблемы как просмотренной
  async markProblemAsReviewed(problemId: string, adminId: string, adminEmail: string): Promise<void> {
    const isAdminUser = await this.isAdmin(adminId, adminEmail);
    
    if (!isAdminUser) {
      throw new Error('Доступ запрещен: только администратор может отмечать проблемы');
    }

    try {
      const problemRef = doc(db, this.PROBLEMS_COLLECTION, problemId);
      const problemSnap = await getDoc(problemRef);
      
      if (!problemSnap.exists()) {
        throw new Error('Проблема не найдена');
      }

      const problemData = problemSnap.data() as LocalProblem;

      await updateDoc(problemRef, {
        reviewed: !problemData.reviewed,
        reviewedAt: problemData.reviewed ? null : new Date().toISOString(),
        reviewedBy: problemData.reviewed ? null : adminId
      });

      console.log('✅ Статус просмотра проблемы обновлен');
    } catch (error) {
      console.error('Ошибка обновления статуса просмотра:', error);
      throw error;
    }
  }

  // Приватные методы

  private async getAllUsers(): Promise<LocalUser[]> {
    try {
      const usersQuery = query(collection(db, this.USERS_COLLECTION));
      const usersSnapshot = await getDocs(usersQuery);
      
      return usersSnapshot.docs.map(doc => doc.data() as LocalUser);
    } catch (error) {
      console.error('Ошибка получения пользователей:', error);
      return [];
    }
  }

  private async getPointsHistory(): Promise<PointsHistory[]> {
    try {
      const historyQuery = query(
        collection(db, this.POINTS_HISTORY_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const historySnapshot = await getDocs(historyQuery);
      
      return historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PointsHistory));
    } catch (error) {
      console.error('Ошибка получения истории баллов:', error);
      return [];
    }
  }

  private async updateUserStats(userId: string, pointsDelta: number, problemsDelta: number): Promise<void> {
    try {
      const userRef = doc(db, this.USERS_COLLECTION, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data() as LocalUser;
        const newTotalPoints = userData.totalPoints + pointsDelta;
        const newTotalProblems = userData.totalProblems + problemsDelta;
        
        const newLevel = this.calculateLevel(newTotalPoints);

        await updateDoc(userRef, {
          totalPoints: newTotalPoints,
          totalProblems: newTotalProblems,
          level: newLevel,
          lastActive: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Ошибка обновления статистики пользователя:', error);
    }
  }

  private async addPointsHistory(userId: string, problemId: string, points: number, reason: string, adminId?: string): Promise<void> {
    try {
      const historyEntry: Omit<PointsHistory, 'id'> = {
        userId,
        problemId,
        points,
        reason,
        createdAt: new Date().toISOString(),
        adminId
      };

      await addDoc(collection(db, this.POINTS_HISTORY_COLLECTION), historyEntry);
    } catch (error) {
      console.error('Ошибка добавления истории баллов:', error);
    }
  }

  private calculateLevel(points: number): 'novice' | 'fighter' | 'master' {
    if (points >= 10) return 'master';
    if (points >= 5) return 'fighter';
    return 'novice';
  }

  private calculateCategoriesStats(problems: LocalProblem[]): any {
    const stats: { [key: string]: number } = {};
    
    problems.forEach(problem => {
      stats[problem.category] = (stats[problem.category] || 0) + 1;
    });
    
    return stats;
  }
}

export const cloudDataService = new CloudDataService(); 