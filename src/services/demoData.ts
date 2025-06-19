import { collection, addDoc, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Problem, User, Season, PointsHistory } from '../types';

// Демо-изображения в base64 (маленькие цветные квадраты)
const DEMO_IMAGES = [
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==', // Белый пиксель
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQI12P4//8/AAX+Av7czFnnAAAAAElFTkSuQmCC', // Красный пиксель
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // Зеленый пиксель
];

export const initializeDemoData = async (): Promise<void> => {
  console.log('🚀 Инициализация демо-данных...');

  try {
    // Проверяем, есть ли уже данные
    const problemsQuery = await getDocs(collection(db, 'problems'));
    if (!problemsQuery.empty) {
      console.log('✅ Демо-данные уже существуют');
      return;
    }

    // 1. Создаем активный сезон
    const seasonData: Omit<Season, 'id'> = {
      name: 'Демо Сезон 2024',
      startDate: new Date(2024, 0, 1).toISOString(),
      endDate: new Date(2024, 11, 31).toISOString(),
      isActive: true,
      totalProblems: 0,
      totalParticipants: 0,
      createdAt: new Date().toISOString(),
    };

    const seasonRef = await addDoc(collection(db, 'seasons'), seasonData);
    console.log('✅ Создан сезон:', seasonRef.id);

    // 2. Создаем демо-пользователей
    const demoUsers: Omit<User, 'id'>[] = [
      {
        email: 'ivanov@example.com',
        displayName: 'Иван Иванов',
        totalPoints: 15,
        totalProblems: 8,
        level: 'master',
        isAdmin: false,
        emailVerified: true,
        createdAt: new Date(2024, 0, 15).toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
      {
        email: 'petrov@example.com',
        displayName: 'Петр Петров',
        totalPoints: 7,
        totalProblems: 5,
        level: 'fighter',
        isAdmin: false,
        emailVerified: true,
        createdAt: new Date(2024, 1, 1).toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
      {
        email: 'sidorov@example.com',
        displayName: 'Сидор Сидоров',
        totalPoints: 3,
        totalProblems: 2,
        level: 'novice',
        isAdmin: false,
        emailVerified: true,
        createdAt: new Date(2024, 2, 10).toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
    ];

    const userIds: string[] = [];
    for (const userData of demoUsers) {
      const userRef = await addDoc(collection(db, 'users'), userData);
      userIds.push(userRef.id);
      console.log('✅ Создан пользователь:', userData.displayName);
    }

    // 3. Создаем демо-проблемы
    const demoProblems: Omit<Problem, 'id'>[] = [
      {
        title: 'Утечка масла в компрессоре №3',
        description: 'Обнаружена утечка масла в районе масляного фильтра компрессора №3. Требуется замена уплотнительного кольца.',
        category: 'maintenance',
        status: 'approved',
        authorId: userIds[0],
        authorName: 'Иван Иванов',
        images: [DEMO_IMAGES[0]],
        points: 1,
        createdAt: new Date(2024, 5, 1, 10, 30).toISOString(),
        updatedAt: new Date(2024, 5, 1, 15, 45).toISOString(),
        reviewedBy: 'admin',
        reviewedAt: new Date(2024, 5, 1, 15, 45).toISOString(),
        reviewComment: 'Проблема подтверждена, работы запланированы',
      },
      {
        title: 'Неисправность датчика температуры',
        description: 'Датчик температуры на линии №2 показывает некорректные значения. Возможно требуется калибровка или замена.',
        category: 'testing',
        status: 'submitted',
        authorId: userIds[1],
        authorName: 'Петр Петров',
        images: [DEMO_IMAGES[1], DEMO_IMAGES[2]],
        points: 1,
        createdAt: new Date(2024, 5, 10, 14, 20).toISOString(),
        updatedAt: new Date(2024, 5, 10, 14, 20).toISOString(),
      },
      {
        title: 'Несоответствие документации процедуре',
        description: 'В процедуре ТО-1 обнаружено несоответствие фактических действий описанию в документации. Требуется актуализация.',
        category: 'audit',
        status: 'reviewing',
        authorId: userIds[0],
        authorName: 'Иван Иванов',
        images: [],
        points: 1,
        createdAt: new Date(2024, 5, 15, 9, 10).toISOString(),
        updatedAt: new Date(2024, 5, 16, 11, 30).toISOString(),
      },
      {
        title: 'Превышение уровня шума на участке сборки',
        description: 'Измеренный уровень шума на участке сборки составляет 85 дБ, что превышает норму в 80 дБ. Необходимы меры по снижению шума.',
        category: 'safety',
        status: 'approved',
        authorId: userIds[2],
        authorName: 'Сидор Сидоров',
        images: [DEMO_IMAGES[0]],
        points: 1,
        createdAt: new Date(2024, 5, 20, 16, 45).toISOString(),
        updatedAt: new Date(2024, 5, 21, 10, 15).toISOString(),
        reviewedBy: 'admin',
        reviewedAt: new Date(2024, 5, 21, 10, 15).toISOString(),
        reviewComment: 'Критически важная проблема, принимаются меры',
      },
      {
        title: 'Дефект поверхности детали после обработки',
        description: 'На поверхности детали №АБВ-123 после токарной обработки обнаружены царапины. Возможно, затупился резец.',
        category: 'quality',
        status: 'resolved',
        authorId: userIds[1],
        authorName: 'Петр Петров',
        images: [DEMO_IMAGES[1]],
        points: 1,
        createdAt: new Date(2024, 4, 25, 13, 20).toISOString(),
        updatedAt: new Date(2024, 4, 26, 8, 45).toISOString(),
        reviewedBy: 'admin',
        reviewedAt: new Date(2024, 4, 26, 8, 45).toISOString(),
        reviewComment: 'Резец заменен, проблема устранена',
      },
    ];

    for (const problemData of demoProblems) {
      await addDoc(collection(db, 'problems'), problemData);
      console.log('✅ Создана проблема:', problemData.title);
    }

    // 4. Создаем историю баллов
    const pointsHistory: Omit<PointsHistory, 'id'>[] = [
      {
        userId: userIds[0],
        problemId: 'demo-1',
        points: 1,
        reason: 'Отправка проблемы: Утечка масла в компрессоре №3',
        createdAt: new Date(2024, 5, 1, 10, 30).toISOString(),
        seasonId: seasonRef.id,
      },
      {
        userId: userIds[0],
        problemId: 'demo-1',
        points: 2,
        reason: 'Бонус от администратора за качественное описание',
        createdAt: new Date(2024, 5, 1, 15, 45).toISOString(),
        seasonId: seasonRef.id,
      },
      {
        userId: userIds[1],
        problemId: 'demo-2',
        points: 1,
        reason: 'Отправка проблемы: Неисправность датчика температуры',
        createdAt: new Date(2024, 5, 10, 14, 20).toISOString(),
        seasonId: seasonRef.id,
      },
    ];

    for (const historyData of pointsHistory) {
      await addDoc(collection(db, 'pointsHistory'), historyData);
    }

    console.log('✅ Демо-данные успешно созданы!');
    console.log('📊 Создано:');
    console.log(`  • Сезонов: 1`);
    console.log(`  • Пользователей: ${demoUsers.length}`);
    console.log(`  • Проблем: ${demoProblems.length}`);
    console.log(`  • Записей истории: ${pointsHistory.length}`);

  } catch (error) {
    console.error('❌ Ошибка создания демо-данных:', error);
    throw error;
  }
};

export const clearDemoData = async (): Promise<void> => {
  console.log('🧹 Очистка демо-данных...');

  try {
    const collections = ['problems', 'users', 'seasons', 'pointsHistory'];

    for (const collectionName of collections) {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const batch = [];

      querySnapshot.forEach((doc) => {
        batch.push(doc.ref);
      });

      // Firebase не поддерживает batch delete для более чем 500 документов
      // Поэтому удаляем по одному
      for (const docRef of batch) {
        await docRef.delete();
      }

      console.log(`✅ Очищена коллекция: ${collectionName} (${batch.length} документов)`);
    }

    console.log('✅ Все демо-данные удалены!');

  } catch (error) {
    console.error('❌ Ошибка очистки демо-данных:', error);
    throw error;
  }
}; 