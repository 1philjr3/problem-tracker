# 🚀 Развертывание на Render.com

## 📋 Пошаговая инструкция

### 1. **Подготовка проекта**

Убедитесь что у вас есть:
- ✅ Аккаунт на [GitHub](https://github.com)
- ✅ Аккаунт на [Render.com](https://render.com)
- ✅ Настроенный Firebase проект

### 2. **Загрузка на GitHub**

```bash
# В папке problem-tracker
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ВАШ_USERNAME/problem-tracker.git
git push -u origin main
```

### 3. **Настройка Firebase для продакшн**

1. Откройте [Firebase Console](https://console.firebase.google.com)
2. Выберите ваш проект
3. Перейдите в **Project Settings** → **General** → **Your apps**
4. Скопируйте конфигурацию Firebase

### 4. **Деплой на Render.com**

#### Шаг 1: Создание сервиса
1. Зайдите на [dashboard.render.com](https://dashboard.render.com)
2. Нажмите **"New"** → **"Static Site"**
3. Подключите ваш GitHub репозиторий

#### Шаг 2: Настройка сборки
```yaml
Build Command: npm install && npm run build
Publish Directory: dist
```

#### Шаг 3: Переменные окружения
Добавьте следующие переменные в **Environment Variables**:

```
VITE_FIREBASE_API_KEY=ваш_api_key
VITE_FIREBASE_AUTH_DOMAIN=ваш_auth_domain
VITE_FIREBASE_PROJECT_ID=ваш_project_id
VITE_FIREBASE_STORAGE_BUCKET=ваш_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=ваш_sender_id
VITE_FIREBASE_APP_ID=ваш_app_id
```

### 5. **Настройка Firestore**

В Firebase Console:
1. Перейдите в **Firestore Database**
2. Создайте базу данных в **Production mode**
3. Настройте правила безопасности:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Пользователи могут читать и писать только свои данные
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Проблемы может читать любой авторизованный пользователь
    match /problems/{problemId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.authorId;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.authorId || 
         request.auth.token.email == 'admin@mail.ru');
    }
    
    // Настройки может изменять только админ
    match /settings/{settingId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email == 'admin@mail.ru';
    }
  }
}
```

### 6. **Переключение на облачную версию**

Замените импорты в компонентах:
```typescript
// Было:
import { localDataService } from '../services/localDataService';

// Стало:
import { cloudDataService as dataService } from '../services/cloudDataService';
```

## 🌐 **Результат**

После деплоя ваше приложение будет доступно по адресу:
```
https://ваш-проект.onrender.com
```

## 🔧 **Автоматические деплои**

Render автоматически пересобирает приложение при каждом push в main ветку GitHub.

## 📱 **Мобильная версия**

Приложение автоматически адаптируется под мобильные устройства благодаря Tailwind CSS.

## 🆘 **Поддержка**

Если возникнут проблемы:
1. Проверьте логи сборки в Render Dashboard
2. Убедитесь что все переменные окружения настроены
3. Проверьте правила Firestore

## 💰 **Стоимость**

- **Render.com**: Бесплатно (с ограничениями)
- **Firebase**: Бесплатный план Spark (достаточно для начала)

## 🚀 **Масштабирование**

При росте нагрузки можно:
- Перейти на платный план Render
- Использовать Firebase Blaze план
- Добавить CDN для статических файлов 