# 🌩️ Настройка облачного хранения Firebase

## 📋 Обзор

Приложение теперь поддерживает облачное хранение данных через Firebase Firestore! Это позволяет:
- 🌍 Доступ к данным с любого устройства
- 👥 Реальный общий рейтинг для всех пользователей
- 🔄 Автоматическая синхронизация данных
- 🔒 Безопасное хранение с правилами доступа

## 🔧 Переключение между локальным и облачным хранением

В файле `src/services/dataService.ts` измените значение константы:

```typescript
// Для облачного хранения:
const USE_CLOUD = true;

// Для локального хранения:
const USE_CLOUD = false;
```

## 🚀 Настройка Firebase

### 1. Создание проекта Firebase

1. Перейдите на [Firebase Console](https://console.firebase.google.com)
2. Создайте новый проект или используйте существующий
3. Включите **Firestore Database**
4. Включите **Authentication** с методом Email/Password

### 2. Конфигурация

Ваша текущая конфигурация в `src/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDbjPRbpsnNy3qfHcLMKlH9UxYW8pMsSwQ",
  authDomain: "quiz-981ac.firebaseapp.com",
  projectId: "quiz-981ac",
  storageBucket: "quiz-981ac.firebasestorage.app",
  messagingSenderId: "1070106055281",
  appId: "1:1070106055281:web:ac88fadc103fd7c5a481d0",
  measurementId: "G-2J095RKCG0"
};
```

### 3. Правила безопасности Firestore

Скопируйте содержимое `firestore.rules` в консоль Firebase:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Только авторизованные пользователи
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId || request.auth.token.email == 'admin@mail.ru';
      allow delete: if request.auth.token.email == 'admin@mail.ru';
    }
    
    // Проблемы
    match /problems/{problemId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.token.email == 'admin@mail.ru' || 
                       (request.auth != null && resource.data.authorId == request.auth.uid);
      allow delete: if request.auth.token.email == 'admin@mail.ru';
    }
    
    // Настройки (только админ)
    match /settings/{settingId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.email == 'admin@mail.ru';
    }
  }
}
```

## 📊 Структура данных в Firestore

### Коллекция `users`
```json
{
  "id": "user123",
  "email": "user@example.com",
  "fullName": "Иван Иванов",
  "isEmailVerified": true,
  "totalPoints": 15,
  "totalProblems": 5,
  "level": "master",
  "joinedAt": "2024-01-01T00:00:00Z",
  "lastActive": "2024-01-15T12:00:00Z"
}
```

### Коллекция `problems`
```json
{
  "id": "problem123",
  "title": "Проблема с оборудованием",
  "description": "Описание проблемы...",
  "category": "equipment",
  "authorId": "user123",
  "authorName": "Иван Иванов",
  "images": ["base64_string_1", "base64_string_2"],
  "points": 3,
  "status": "pending",
  "reviewed": false,
  "createdAt": "2024-01-15T10:00:00Z",
  "seasonId": "current"
}
```

### Коллекция `settings`
```json
{
  "currentSeason": "season-2024",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "isActive": true,
  "isFinished": false
}
```

## 🔄 Миграция данных

Если у вас есть локальные данные, которые нужно перенести в облако:

1. Установите `USE_CLOUD = false` в `dataService.ts`
2. Экспортируйте данные через кнопку "Экспорт данных"
3. Установите `USE_CLOUD = true`
4. Импортируйте данные через Firebase Console

## ⚡ Преимущества облачного хранения

1. **Доступность**: Данные доступны с любого устройства
2. **Масштабируемость**: Автоматическое масштабирование
3. **Надежность**: Резервное копирование от Google
4. **Реальное время**: Мгновенная синхронизация
5. **Безопасность**: Правила доступа на уровне базы данных

## 🚨 Важные замечания

1. **Администратор**: Пользователь с email `admin@mail.ru` имеет расширенные права
2. **Изображения**: Хранятся как base64 строки в Firestore (ограничение 1MB на документ)
3. **Производительность**: Для больших изображений рекомендуется использовать Firebase Storage
4. **Лимиты**: Бесплатный план Firebase имеет ограничения на количество операций

## 🛠️ Отладка

Если возникают проблемы:

1. Проверьте консоль браузера на наличие ошибок
2. Убедитесь, что правила Firestore настроены правильно
3. Проверьте, что пользователь авторизован
4. Убедитесь, что `USE_CLOUD = true` в `dataService.ts`

## 📞 Поддержка

При возникновении проблем:
- Проверьте [документацию Firebase](https://firebase.google.com/docs)
- Посмотрите логи в Firebase Console
- Проверьте статус сервисов Firebase 