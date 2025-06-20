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
import type { Problem, User, SeasonSettings, LeaderboardEntry } from '../types';

class CloudDataService {
  // Коллекции Firestore
  private readonly USERS_COLLECTION = 'users';
  private readonly PROBLEMS_COLLECTION = 'problems';
  private readonly SETTINGS_COLLECTION = 'settings';

  // Сохранение изображения в base64 (как было в локальной версии)
  async saveImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Управление пользователями
  async saveUser(user: Omit<User, 'totalPoints' | 'totalProblems' | 'level'>): Promise<void> {
    try {
      const userRef = doc(db, this.USERS_COLLECTION, user.id);
      await setDoc(userRef, {
        ...user,
        totalPoints: 0,
        totalProblems: 0,
        level: 'novice',
        lastActive: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Ошибка сохранения пользователя:', error);
      throw error;
    }
  }

  async getUserDisplayName(userId: string, email: string): Promise<string> {
    try {
      const userRef = doc(db, this.USERS_COLLECTION, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        return userData.fullName || email;
      }
      return email;
    } catch (error) {
      console.error('Ошибка получения имени пользователя:', error);
      return email;
    }
  }

  // Управление проблемами
  async addProblem(problemData: {
    title: string;
    description: string;
    category: string;
    authorId: string;
    authorName: string;
    images: string[];
  }): Promise<Problem> {
    try {
      const problem = {
        ...problemData,
        points: 1,
        status: 'pending' as const,
        reviewed: false,
        createdAt: new Date(),
        seasonId: 'current'
      };

      const docRef = await addDoc(collection(db, this.PROBLEMS_COLLECTION), problem);
      
      // Обновляем статистику пользователя
      await this.updateUserStats(problemData.authorId, 1, 1);

      return {
        id: docRef.id,
        ...problem
      };
    } catch (error) {
      console.error('Ошибка добавления проблемы:', error);
      throw error;
    }
  }

  async getAllProblems(): Promise<Problem[]> {
    try {
      const q = query(
        collection(db, this.PROBLEMS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Problem));
    } catch (error) {
      console.error('Ошибка получения проблем:', error);
      return [];
    }
  }

  async addBonusPoints(problemId: string, bonusPoints: number, adminId: string, adminEmail: string): Promise<void> {
    const isAdminUser = await this.isAdmin(adminId, adminEmail);
    if (!isAdminUser) {
      throw new Error('Доступ запрещен: только администратор может добавлять бонусные баллы');
    }

    try {
      const problemRef = doc(db, this.PROBLEMS_COLLECTION, problemId);
      const problemSnap = await getDoc(problemRef);
      
      if (!problemSnap.exists()) {
        throw new Error('Проблема не найдена');
      }

      const problemData = problemSnap.data() as Problem;
      const newPoints = problemData.points + bonusPoints;

      await updateDoc(problemRef, {
        points: newPoints
      });

      // Обновляем баллы пользователя
      await this.updateUserStats(problemData.authorId, bonusPoints, 0);
    } catch (error) {
      console.error('Ошибка добавления бонусных баллов:', error);
      throw error;
    }
  }

  async markProblemAsReviewed(problemId: string, adminId: string, adminEmail: string): Promise<void> {
    const isAdminUser = await this.isAdmin(adminId, adminEmail);
    if (!isAdminUser) {
      throw new Error('Доступ запрещен: только администратор может отмечать проблемы как просмотренные');
    }

    try {
      const problemRef = doc(db, this.PROBLEMS_COLLECTION, problemId);
      const problemSnap = await getDoc(problemRef);
      
      if (!problemSnap.exists()) {
        throw new Error('Проблема не найдена');
      }

      const problemData = problemSnap.data() as Problem;

      await updateDoc(problemRef, {
        reviewed: !problemData.reviewed,
        reviewedAt: problemData.reviewed ? null : new Date().toISOString(),
        reviewedBy: problemData.reviewed ? null : adminId
      });
    } catch (error) {
      console.error('Ошибка обновления статуса просмотра:', error);
      throw error;
    }
  }

  // Рейтинг
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const q = query(
        collection(db, this.USERS_COLLECTION),
        where('totalPoints', '>', 0),
        orderBy('totalPoints', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs
        .map((doc, index) => {
          const userData = doc.data();
          return {
            userId: userData.id,
            fullName: userData.fullName,
            points: userData.totalPoints,
            answersCount: userData.totalProblems,
            level: userData.level,
            position: index + 1
          };
        })
        .filter(user => user.fullName !== 'admin'); // Исключаем админа
    } catch (error) {
      console.error('Ошибка получения рейтинга:', error);
      return [];
    }
  }

  // Управление сезоном
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
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          isFinished: false
        };
        
        await setDoc(settingsRef, defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error('Ошибка получения настроек сезона:', error);
      return {
        currentSeason: 'season-2024',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        isFinished: false
      };
    }
  }

  async updateSeasonSettings(newSettings: Partial<SeasonSettings>, adminId: string, adminEmail: string): Promise<void> {
    const isAdminUser = await this.isAdmin(adminId, adminEmail);
    if (!isAdminUser) {
      throw new Error('Доступ запрещен: только администратор может управлять сезоном');
    }

    try {
      const settingsRef = doc(db, this.SETTINGS_COLLECTION, 'current');
      await updateDoc(settingsRef, newSettings);
    } catch (error) {
      console.error('Ошибка обновления настроек сезона:', error);
      throw error;
    }
  }

  async resetSeason(adminId: string, adminEmail: string): Promise<void> {
    const isAdminUser = await this.isAdmin(adminId, adminEmail);
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

      // Обновляем настройки сезона
      const settingsRef = doc(db, this.SETTINGS_COLLECTION, 'current');
      batch.update(settingsRef, {
        isFinished: false,
        isActive: true
      });

      await batch.commit();
    } catch (error) {
      console.error('Ошибка сброса сезона:', error);
      throw error;
    }
  }

  // Утилиты
  async isAdmin(userId: string, email: string): Promise<boolean> {
    return email === 'admin@mail.ru';
  }

  private async updateUserStats(userId: string, pointsDelta: number, problemsDelta: number): Promise<void> {
    try {
      const userRef = doc(db, this.USERS_COLLECTION, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const newTotalPoints = (userData.totalPoints || 0) + pointsDelta;
        const newTotalProblems = (userData.totalProblems || 0) + problemsDelta;
        
        let newLevel: 'novice' | 'fighter' | 'master' = 'novice';
        if (newTotalPoints >= 10) newLevel = 'master';
        else if (newTotalPoints >= 5) newLevel = 'fighter';

        await updateDoc(userRef, {
          totalPoints: newTotalPoints,
          totalProblems: newTotalProblems,
          level: newLevel,
          lastActive: serverTimestamp()
        });
      } else {
        // Создаем пользователя если его нет
        await setDoc(userRef, {
          id: userId,
          totalPoints: pointsDelta,
          totalProblems: problemsDelta,
          level: 'novice',
          lastActive: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Ошибка обновления статистики пользователя:', error);
    }
  }

  async deleteUser(userId: string, adminId: string, adminEmail: string): Promise<void> {
    const isAdminUser = await this.isAdmin(adminId, adminEmail);
    if (!isAdminUser) {
      throw new Error('Доступ запрещен: только администратор может удалять пользователей');
    }

    try {
      // Удаляем все проблемы пользователя
      const problemsQuery = query(
        collection(db, this.PROBLEMS_COLLECTION),
        where('authorId', '==', userId)
      );
      const problemsSnapshot = await getDocs(problemsQuery);
      
      const batch = writeBatch(db);
      problemsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Удаляем пользователя
      const userRef = doc(db, this.USERS_COLLECTION, userId);
      batch.delete(userRef);

      await batch.commit();
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      throw error;
    }
  }

  async finishSeason(adminId: string, adminEmail: string): Promise<void> {
    const isAdminUser = await this.isAdmin(adminId, adminEmail);
    if (!isAdminUser) {
      throw new Error('Доступ запрещен: только администратор может завершать сезон');
    }

    try {
      const settingsRef = doc(db, this.SETTINGS_COLLECTION, 'current');
      await updateDoc(settingsRef, {
        isFinished: true,
        isActive: false
      });
    } catch (error) {
      console.error('Ошибка завершения сезона:', error);
      throw error;
    }
  }
}

export const cloudDataService = new CloudDataService(); 