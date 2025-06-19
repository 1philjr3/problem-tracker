// Пользователь
export interface User {
  id: string;
  email: string;
  fullName: string;
  points: number;
  level: UserLevel;
  answersCount: number;
  createdAt: Date;
  isAdmin?: boolean;
}

// Уровни пользователей
export type UserLevel = 'novice' | 'fighter' | 'master';

// Функция для определения уровня по количеству ответов
export const getUserLevel = (answersCount: number): UserLevel => {
  if (answersCount >= 10) return 'master';
  if (answersCount >= 5) return 'fighter';
  return 'novice';
};

// Эмодзи для уровней
export const levelEmojis: Record<UserLevel, string> = {
  novice: '🏁',
  fighter: '🛠️',
  master: '🧠'
};

// Названия уровней на русском
export const levelNames: Record<UserLevel, string> = {
  novice: 'Новичок',
  fighter: 'Боец',
  master: 'Мастер'
};

// Проблема/кейс
export interface Problem {
  id: string;
  title: string;
  details: string;
  category: ProblemCategory;
  authorId: string;
  authorName: string;
  createdAt: Date;
  imageUrl?: string;
  bonusPoints?: number; // Дополнительные баллы от админа
}

// Категории проблем
export type ProblemCategory = 'maintenance' | 'testing' | 'audit' | 'safety' | 'quality' | 'other';

// Названия категорий на русском
export const categoryNames: Record<ProblemCategory, string> = {
  maintenance: 'Техническое обслуживание',
  testing: 'Испытания',
  audit: 'Аудит',
  safety: 'Безопасность',
  quality: 'Качество',
  other: 'Другое'
};

// Сезон
export interface Season {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy: string;
}

// Данные для рейтинга
export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  points: number;
  answersCount: number;
  level: UserLevel;
  position: number;
}

// Статистика пользователя
export interface UserStats {
  totalPoints: number;
  totalAnswers: number;
  currentLevel: UserLevel;
  problemsByCategory: Record<ProblemCategory, number>;
  pointsHistory: PointsHistoryEntry[];
}

// История начисления баллов
export interface PointsHistoryEntry {
  id: string;
  userId: string;
  points: number;
  reason: string;
  createdAt: Date;
  type: 'problem_submitted' | 'admin_bonus';
} 