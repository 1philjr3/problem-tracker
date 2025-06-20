# 🚀 Деплой на Render.com

## 📋 Инструкция по развертыванию

### 1. Подготовка проекта
Убедитесь, что проект собирается локально:
```bash
npm install
npm run build
```

### 2. Создание аккаунта на Render
1. Перейдите на [render.com](https://render.com)
2. Зарегистрируйтесь через GitHub
3. Подключите ваш репозиторий

### 3. Настройка Static Site
1. В панели Render нажмите "New +" → "Static Site"
2. Выберите ваш репозиторий `problem-tracker`
3. Настройте параметры:

**Основные настройки:**
- **Name:** `problem-tracker`
- **Branch:** `main` (или ваша основная ветка)
- **Root Directory:** Оставьте пустым
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`

**Переменные окружения (Environment Variables):**
Добавьте следующие переменные:
```
VITE_FIREBASE_API_KEY=AIzaSyDbjPRbpsnNy3qfHcLMKlH9UxYW8pMsSwQ
VITE_FIREBASE_AUTH_DOMAIN=quiz-981ac.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=quiz-981ac
VITE_FIREBASE_STORAGE_BUCKET=quiz-981ac.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1070106055281
VITE_FIREBASE_APP_ID=1:1070106055281:web:ac88fadc103fd7c5a481d0
VITE_FIREBASE_MEASUREMENT_ID=G-2J095RKCG0
```

### 4. Настройка Firebase
Убедитесь, что в Firebase Console:
1. **Authentication** включен с Email/Password
2. **Firestore** создан и настроен
3. **Правила безопасности** загружены из `firestore.rules`

### 5. Деплой
1. Нажмите "Create Static Site"
2. Render автоматически начнет сборку
3. Процесс займет 3-5 минут
4. После завершения получите URL вида: `https://problem-tracker-xxx.onrender.com`

### 6. Проверка
После деплоя проверьте:
- ✅ Страница загружается
- ✅ Регистрация работает
- ✅ Авторизация работает
- ✅ Отправка проблем работает
- ✅ Рейтинг отображается

## 🔧 Возможные проблемы

### Ошибка сборки
Если сборка падает:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что локально `npm run build` работает
3. Проверьте версии Node.js (используется последняя LTS)

### Проблемы с Firebase
Если Firebase не работает:
1. Проверьте переменные окружения
2. Убедитесь, что домен добавлен в Firebase Console
3. Проверьте правила безопасности Firestore

### Маршрутизация
Если страницы не открываются при прямом переходе:
- Render автоматически настроен для SPA через `render.yaml`

## 📱 Автоматическое обновление

Render автоматически пересобирает сайт при каждом push в GitHub:
1. Внесите изменения в код
2. Сделайте commit и push
3. Render автоматически начнет новую сборку
4. Через несколько минут изменения будут доступны

## 🌐 Кастомный домен

Для подключения собственного домена:
1. В настройках Static Site → Custom Domains
2. Добавьте ваш домен
3. Настройте DNS согласно инструкциям Render

## 📊 Мониторинг

Render предоставляет:
- 📈 Аналитику трафика
- 📋 Логи деплоев
- ⚡ Метрики производительности
- 🔔 Уведомления о статусе

---

**🎉 Готово! Ваше приложение доступно в интернете!** 