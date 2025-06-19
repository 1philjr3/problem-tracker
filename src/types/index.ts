// Базовые типы пользователей
export interface User {
  id: string;
  email: string;
  fullName: string;
  isEmailVerified: boolean;
  totalPoints: number; // Общее количество баллов
  totalProblems: number; // Количество отправленных проблем
  level: 'novice' | 'fighter' | 'master';
  joinedAt: string;
  lastActive: string;
  isAdmin?: boolean; // Для админских прав
}

// Категории проблем
export type ProblemCategory = 
  | 'maintenance'   // ТО
  | 'testing'       // Испытания  
  | 'audit'         // Аудит
  | 'pnr'           // ПНР
  | 'safety'        // Безопасность
  | 'quality'       // Качество
  | 'equipment'     // Оборудование
  | 'process'       // Процессы
  | 'other';        // Другое

export type ProblemStatus = 
  | 'pending'      // Ожидает рассмотрения
  | 'reviewed'     // Рассмотрено
  | 'resolved';    // Решено

// Типы проблем
export interface Problem {
  id: string;
  title: string;
  description: string;
  details?: string; // Дополнительные детали (опционально)
  category: ProblemCategory | string; // Может быть строкой для совместимости
  authorId: string;
  authorName: string;
  images: string[]; // Имена файлов изображений
  points: number; // Баллы за проблему (1 + бонусы)
  status: ProblemStatus;
  reviewed: boolean; // Отмечена ли проблема как просмотренная админом
  reviewedAt?: string | Date; // Дата просмотра
  reviewedBy?: string; // ID админа, который просмотрел
  createdAt: string | Date;
  seasonId: string;
  adminNotes?: string; // Заметки администратора
}

// Сезоны соревнований
export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  totalProblems: number;
  totalParticipants: number;
  createdAt: string;
}

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

// Настройки сезона
export interface SeasonSettings {
  currentSeason: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isFinished: boolean;
}

// Запись в таблице лидеров
export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  points: number;
  answersCount: number;
  position: number;
}

// Константы уровней
export const LEVELS = {
  novice: {
    name: 'Новичок',
    emoji: '🏁',
    minPoints: 1,
    maxPoints: 4,
    color: '#10B981', // green
  },
  fighter: {
    name: 'Боец',
    emoji: '🛠️',
    minPoints: 5,
    maxPoints: 9,
    color: '#F59E0B', // amber
  },
  master: {
    name: 'Мастер',
    emoji: '🧠',
    minPoints: 10,
    maxPoints: Infinity,
    color: '#8B5CF6', // violet
  },
} as const;

// Константы категорий
export const CATEGORIES = {
  maintenance: {
    name: 'ТО',
    emoji: '🔧',
    color: '#3B82F6', // blue
  },
  testing: {
    name: 'Испытания',
    emoji: '🧪',
    color: '#EF4444', // red
  },
  audit: {
    name: 'Аудит',
    emoji: '📋',
    color: '#8B5CF6', // violet
  },
  pnr: {
    name: 'ПНР',
    emoji: '🏭',
    color: '#059669', // emerald
  },
  safety: {
    name: 'Безопасность',
    emoji: '⚠️',
    color: '#F59E0B', // amber
  },
  quality: {
    name: 'Качество',
    emoji: '✅',
    color: '#10B981', // green
  },
  equipment: {
    name: 'Оборудование',
    emoji: '⚙️',
    color: '#6B7280', // gray
  },
  process: {
    name: 'Процессы',
    emoji: '🔄',
    color: '#EC4899', // pink
  },
  other: {
    name: 'Другое',
    emoji: '📝',
    color: '#6366F1', // indigo
  },
} as const;

// Утилитарные функции
export const getLevelInfo = (points: number) => {
  if (points >= 10) return LEVELS.master;
  if (points >= 5) return LEVELS.fighter;
  return LEVELS.novice;
};

export const getCategoryInfo = (category: ProblemCategory | string) => {
  return CATEGORIES[category as ProblemCategory] || CATEGORIES.other;
}; 