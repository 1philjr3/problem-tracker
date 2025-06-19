# 🔥 Настройка Firebase Firestore для Problem Tracker

## 📋 Инструкция по настройке облачной базы данных

### 1. **Настройка правил безопасности Firestore**

В Firebase Console перейдите в **Firestore Database** → **Rules** и замените правила на:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Пользователи могут читать и записывать свои данные
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Все могут читать профили для рейтинга
    }
    
    // Проблемы - все могут читать, создавать могут только авторизованные
    match /problems/{problemId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.authorId;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.authorId || request.auth.token.email == 'admin@mail.ru');
    }
    
    // История баллов - только чтение для всех авторизованных
    match /pointsHistory/{historyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Настройки сезона - только админ может изменять
    match /settings/{settingId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email == 'admin@mail.ru';
    }
  }
}
```

### 2. **Структура данных в Firestore**

#### Коллекция `users`
```typescript
{
  id: string,           // UID пользователя
  email: string,        // Email пользователя
  fullName: string,     // ФИО пользователя
  totalPoints: number,  // Общее количество баллов
  totalProblems: number,// Количество отправленных проблем
  level: 'novice' | 'fighter' | 'master', // Уровень
  joinedAt: string,     // Дата регистрации (ISO)
  lastActive: string,   // Последняя активность (ISO)
  isAdmin?: boolean     // Флаг администратора
}
```

#### Коллекция `problems`
```typescript
{
  id: string,           // Автогенерируемый ID
  title: string,        // Название проблемы
  description: string,  // Описание проблемы
  category: string,     // Категория проблемы
  authorId: string,     // UID автора
  authorName: string,   // Имя автора
  images: string[],     // Массив base64 изображений
  points: number,       // Количество баллов за проблему
  status: 'pending' | 'reviewed', // Статус проблемы
  reviewed: boolean,    // Просмотрена ли админом
  reviewedAt?: string,  // Дата просмотра (ISO)
  reviewedBy?: string,  // UID админа, который просмотрел
  createdAt: string,    // Дата создания (ISO)
  adminNotes?: string   // Заметки админа
}
```

#### Коллекция `pointsHistory`
```typescript
{
  id: string,           // Автогенерируемый ID
  userId: string,       // UID пользователя
  problemId: string,    // ID проблемы
  points: number,       // Количество баллов
  reason: string,       // Причина начисления
  createdAt: string,    // Дата начисления (ISO)
  adminId?: string      // UID админа (если бонусные баллы)
}
```

#### Коллекция `settings`
```typescript
// Документ с ID 'current'
{
  currentSeason: string,    // Название текущего сезона
  seasonStartDate: string,  // Дата начала сезона (ISO)
  seasonEndDate: string,    // Дата окончания сезона (ISO)
  isActive: boolean,        // Активен ли сезон
  lastBackup: string        // Дата последнего бекапа (ISO)
}
```

### 3. **Индексы для оптимизации**

В Firebase Console → **Firestore Database** → **Indexes** создайте составные индексы:

#### Для пользователей (рейтинг):
- Коллекция: `users`
- Поля: `totalPoints` (Descending), `__name__` (Ascending)

#### Для проблем (сортировка по дате):
- Коллекция: `problems`
- Поля: `createdAt` (Descending), `__name__` (Ascending)

#### Для истории баллов:
- Коллекция: `pointsHistory`
- Поля: `createdAt` (Descending), `__name__` (Ascending)

### 4. **Администратор системы**

Администратором является пользователь с email: **admin@mail.ru**

Права администратора:
- ✅ Добавление бонусных баллов (1-10 за проблему)
- ✅ Отметка проблем как просмотренных
- ✅ Управление настройками сезона
- ✅ Удаление пользователей из рейтинга
- ✅ Сброс и завершение сезона
- ✅ Экспорт данных

### 5. **Безопасность и производительность**

#### Правила безопасности:
- ✅ Только авторизованные пользователи могут работать с данными
- ✅ Пользователи могут изменять только свои данные
- ✅ Только админ может управлять системными настройками
- ✅ Все могут читать рейтинг и проблемы

#### Ограничения:
- 📊 **Чтение**: 50,000 операций/день (бесплатно)
- 📝 **Запись**: 20,000 операций/день (бесплатно)
- 💾 **Хранилище**: 1 ГБ (бесплатно)

### 6. **Мониторинг и отладка**

#### В Firebase Console можно отслеживать:
- 📈 **Usage**: Количество операций чтения/записи
- 🔍 **Logs**: Ошибки и предупреждения
- 👥 **Authentication**: Активные пользователи
- 💾 **Storage**: Использование места

#### Полезные команды для отладки:
```javascript
// В консоли браузера
console.log('Текущий пользователь:', auth.currentUser);
console.log('Подключение к Firestore:', db.app.name);
```

### 7. **Резервное копирование**

Для резервного копирования данных используйте функцию экспорта в приложении:
- 📦 **Экспорт всех данных** в JSON формате
- 💾 **Автоматическое сохранение** на компьютер пользователя
- 🔄 **Регулярные бекапы** через админскую панель

---

## 🚀 Готово к использованию!

После настройки правил и индексов ваша система готова к работе в облаке:

- ☁️ **Синхронизация** данных между всеми пользователями
- 🏆 **Общий рейтинг** для всех участников
- 👨‍💼 **Централизованное управление** через админа
- 📱 **Доступ с любого устройства** через интернет

### Ссылки:
- 🔗 **GitHub**: https://github.com/1philjr3/problem-tracker
- 🔥 **Firebase Console**: https://console.firebase.google.com
- 🌐 **Деплой на Render**: см. DEPLOY.md 