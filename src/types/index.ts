// Базовые типы пользователей
export type UserLevel = 'novice' | 'fighter' | 'master';

export interface User {
  id: string;
  email: string;
  fullName: string;
  level: UserLevel;
  totalPoints: number;
  totalProblems: number;
  createdAt: Date;
  joinedAt?: string;
  lastActive?: string;
  isAdmin?: boolean;
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
  category: string;
  images: string[];
  authorId: string;
  authorName: string;
  points: number;
  status: 'pending' | 'resolved';
  reviewed: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: Date | string;
  seasonId: string;
  adminNotes?: string;
}

// Сезоны соревнований
export interface Season {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isFinished: boolean;
}

export interface SeasonSettings {
  currentSeason: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isFinished: boolean;
  seasonStartDate?: string;
  seasonEndDate?: string;
}

export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  points: number;
  answersCount: number;
  level: UserLevel;
  position: number;
}

// История начисления баллов
export interface PointsHistory {
  id: string;
  userId: string;
  points: number;
  reason: string;
  problemId?: string;
  adminId?: string;
  createdAt: Date;
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
export const getLevelInfo = (level: UserLevel) => {
  switch (level) {
    case 'master':
      return { name: 'Мастер', icon: '🧠', color: 'text-purple-600' };
    case 'fighter':
      return { name: 'Боец', icon: '🛠️', color: 'text-blue-600' };
    default:
      return { name: 'Новичок', icon: '🏁', color: 'text-gray-600' };
  }
};

export const getUserLevel = (points: number): UserLevel => {
  if (points >= 10) return 'master';
  if (points >= 5) return 'fighter';
  return 'novice';
};

export const getCategoryInfo = (category: ProblemCategory) => {
  return CATEGORIES[category];
}; 