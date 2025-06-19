// Выбор между локальным и облачным хранением
// Для переключения на облачное хранение измените USE_CLOUD на true
const USE_CLOUD = true; // <-- ИЗМЕНИТЕ НА true ДЛЯ ИСПОЛЬЗОВАНИЯ FIREBASE

// Импортируем сервисы
import { localDataService } from './localDataService';
import { cloudDataService } from './cloudDataService';

// Экспортируем нужный сервис
export const dataService = USE_CLOUD ? cloudDataService : localDataService;

// Для совместимости экспортируем типы из локального сервиса
export type { LocalUser, LocalProblem, SeasonSettings } from './localDataService';

console.log(`Используется ${USE_CLOUD ? 'облачное (Firebase)' : 'локальное'} хранилище данных`); 