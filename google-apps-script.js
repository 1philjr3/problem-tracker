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
  const output = ContentService
    .createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Google Sheets API работает!',
      spreadsheetId: SPREADSHEET_ID,
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  
  // Добавляем CORS заголовки
  output.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  
  return output;
}

/**
 * Обработчик POST запросов
 */
function doPost(e) {
  try {
    console.log('📱 Получен запрос:', new Date().toISOString());
    
    // Парсим входящие данные
    if (!e.postData || !e.postData.contents) {
      throw new Error('Нет данных в запросе');
    }
    
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const data = requestData.data;
    
    let result;
    
    switch(action) {
      case 'addSurvey':
        result = addSurveyData(data);
        break;
      default:
        throw new Error('Неизвестное действие: ' + action);
    }
    
    const output = ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        result: result,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
    // Добавляем CORS заголовки
    output.setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    
    return output;
      
  } catch (error) {
    console.error('❌ Ошибка:', error.toString());
    
    const output = ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
    // Добавляем CORS заголовки даже для ошибок
    output.setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    
    return output;
  }
}

/**
 * Добавляет новую строку с данными опроса
 */
function addSurveyData(data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Лист не найден');
    }
    
    // Создаем заголовки если лист пустой
    if (sheet.getLastRow() === 0) {
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
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    // Добавляем временную метку
    if (!data.timestamp) {
      data.timestamp = new Date().toLocaleString('ru-RU');
    }
    
    // Переводим на русский
    const categoryRussian = CATEGORY_NAMES[data.category] || data.category;
    const metricRussian = METRIC_NAMES[data.metric] || data.metric;
    
    // Подготавливаем строку
    const row = [
      data.timestamp,
      data.title || '',
      categoryRussian,
      metricRussian,
      data.description || '',
      data.imageBase64 || '',
      data.authorId || '',
      data.authorName || ''
    ];
    
    // Добавляем строку
    sheet.appendRow(row);
    
    return {
      message: 'Данные добавлены',
      rowNumber: sheet.getLastRow()
    };
    
  } catch (error) {
    throw new Error('Не удалось добавить данные: ' + error.toString());
  }
} 