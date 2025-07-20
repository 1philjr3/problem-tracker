/**
 * Google Apps Script для работы с Google Sheets как базой данных
 * 
 * Инструкция по установке:
 * 1. Откройте вашу Google таблицу
 * 2. Перейдите в Расширения -> Apps Script
 * 3. Удалите весь код и вставьте этот
 * 4. Сохраните проект (Ctrl+S)
 * 5. Нажмите "Развернуть" -> "Новое развертывание"
 * 6. Выберите тип: "Веб-приложение"
 * 7. Установите:
 *    - Описание: "Survey Data API"
 *    - Запуск от имени: "От моего имени"
 *    - Кто имеет доступ: "Все"
 * 8. Нажмите "Развернуть"
 * 9. Скопируйте URL веб-приложения
 */

// ID вашей таблицы (берется из URL)
const SPREADSHEET_ID = '1PHrQ8ZwjrOc4_9QuvpQltuMpuSUGIlcb96lp6korbTA';
const SHEET_NAME = 'Лист1';

// Русские названия категорий
const CATEGORY_NAMES = {
  'maintenance': 'ТО',
  'testing': 'Испытания', 
  'audit': 'Аудит',
  'pnr': 'ПНР',
  'safety': 'Безопасность',
  'quality': 'Качество',
  'equipment': 'Оборудование',
  'process': 'Процессы',
  'warranty': 'Гарантия',
  'other': 'Другое'
};

// Русские названия метрик
const METRIC_NAMES = {
  'design': 'Проектирование',
  'installation': 'Монтаж',
  'interaction': 'Взаимодействие', 
  'documentation': 'Документация',
  'control': 'Контроль',
  'other': 'Другое'
};

/**
 * Обработчик GET запросов (для тестирования)
 */
function doGet(e) {
  Logger.log('GET запрос получен');
  
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Google Sheets API работает!',
      spreadsheetId: SPREADSHEET_ID,
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Обработчик POST запросов
 */
function doPost(e) {
  try {
    Logger.log('POST запрос получен');
    Logger.log('Параметры:', e.parameter);
    Logger.log('Тип контента:', e.postData ? e.postData.type : 'не указан');
    
    let requestData;
    let action;
    let data;
    
    // Обрабатываем разные типы данных
    if (e.parameter && e.parameter.action) {
      // FormData
      action = e.parameter.action;
      if (e.parameter.data) {
        try {
          data = JSON.parse(e.parameter.data);
        } catch (parseError) {
          Logger.log('Ошибка парсинга данных из FormData:', parseError);
          throw new Error('Неверный формат данных в FormData');
        }
      }
    } else if (e.postData && e.postData.contents) {
      // JSON
      try {
        requestData = JSON.parse(e.postData.contents);
        action = requestData.action;
        data = requestData.data;
      } catch (parseError) {
        Logger.log('Ошибка парсинга JSON:', parseError);
        throw new Error('Неверный формат JSON');
      }
    } else {
      throw new Error('Не найдены данные в запросе');
    }
    
    Logger.log('Действие:', action);
    Logger.log('Данные:', data);
    
    let result;
    
    switch(action) {
      case 'addSurvey':
        result = addSurveyData(data);
        break;
      case 'getSurveys':
        result = getAllSurveys();
        break;
      case 'createHeaders':
        result = createHeaders();
        break;
      default:
        throw new Error('Неизвестное действие: ' + action);
    }
    
    Logger.log('Результат:', result);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        result: result,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Ошибка в doPost:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Добавляет новую строку с данными опроса
 */
function addSurveyData(data) {
  try {
    Logger.log('Добавляем данные опроса:', data);
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    // Если лист пустой, создаем заголовки
    if (sheet.getLastRow() === 0) {
      Logger.log('Лист пустой, создаем заголовки');
      createHeaders();
    }
    
    // Добавляем временную метку в российском формате, если её нет
    let timestamp = data.timestamp;
    if (!timestamp) {
      const now = new Date();
      timestamp = now.toLocaleDateString('ru-RU') + ', ' + now.toLocaleTimeString('ru-RU');
    }
    
    // Переводим названия на русский
    const categoryRussian = CATEGORY_NAMES[data.category] || data.category;
    const metricRussian = METRIC_NAMES[data.metric] || data.metric;
    
    // Подготавливаем данные для вставки
    const row = [
      timestamp,
      data.title || '',
      categoryRussian,
      metricRussian,
      data.description || '',
      data.imageBase64 || '', // Теперь это URL изображения
      data.authorId || '',
      data.authorName || ''
    ];
    
    Logger.log('Добавляем строку:', row);
    
    // Добавляем строку в таблицу
    sheet.appendRow(row);
    
    const result = {
      message: 'Данные успешно добавлены',
      rowNumber: sheet.getLastRow(),
      timestamp: timestamp
    };
    
    Logger.log('Данные добавлены успешно:', result);
    return result;
    
  } catch (error) {
    Logger.log('Ошибка при добавлении данных:', error);
    throw error;
  }
}

/**
 * Получает все данные опросов
 */
function getAllSurveys() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return [];
    }
    
    // Получаем все данные, кроме заголовков
    const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
    
    // Преобразуем в массив объектов
    return data.map(row => ({
      timestamp: row[0],
      title: row[1],
      category: row[2],
      metric: row[3],
      description: row[4],
      imageUrl: row[5], // Теперь это URL
      authorId: row[6],
      authorName: row[7]
    }));
  } catch (error) {
    Logger.log('Ошибка при получении данных:', error);
    throw error;
  }
}

/**
 * Создает заголовки таблицы
 */
function createHeaders() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    const headers = [
      'Дата и время',
      'Название проблемы',
      'Категория',
      'Метрика',
      'Описание',
      'Фотография',
      'ID пользователя',
      'Имя пользователя'
    ];
    
    // Добавляем заголовки в первую строку
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Форматируем заголовки
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0f0f0');
    
    Logger.log('Заголовки созданы');
    
    return {
      message: 'Заголовки созданы',
      headers: headers
    };
  } catch (error) {
    Logger.log('Ошибка при создании заголовков:', error);
    throw error;
  }
}

/**
 * Тестовая функция для проверки работы скрипта
 */
function test() {
  const testData = {
    title: 'Тестовая проблема',
    category: 'maintenance',
    metric: 'control',
    description: 'Это тестовое описание проблемы',
    imageBase64: 'https://example.com/image.jpg',
    authorId: 'test-user-123',
    authorName: 'Иван Иванов'
  };
  
  const result = addSurveyData(testData);
  console.log('Результат теста:', result);
} 