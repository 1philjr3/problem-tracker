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

/**
 * Обработчик GET запросов (для тестирования)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Google Sheets API работает!',
      spreadsheetId: SPREADSHEET_ID
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Обработчик POST запросов
 */
function doPost(e) {
  try {
    // Парсим входящие данные
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const data = requestData.data;
    
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
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        result: result
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Добавляет новую строку с данными опроса
 */
function addSurveyData(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  
  // Если лист пустой, создаем заголовки
  if (sheet.getLastRow() === 0) {
    createHeaders();
  }
  
  // Добавляем временную метку, если её нет
  if (!data.timestamp) {
    data.timestamp = new Date().toISOString();
  }
  
  // Подготавливаем данные для вставки
  const row = [
    data.timestamp,
    data.title || '',
    data.category || '',
    data.metric || '',
    data.description || '',
    data.imageBase64 || '',
    data.authorId || '',
    data.authorName || ''
  ];
  
  // Добавляем строку в таблицу
  sheet.appendRow(row);
  
  return {
    message: 'Данные успешно добавлены',
    rowNumber: sheet.getLastRow()
  };
}

/**
 * Получает все данные опросов
 */
function getAllSurveys() {
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
    imageBase64: row[5],
    authorId: row[6],
    authorName: row[7]
  }));
}

/**
 * Создает заголовки столбцов
 */
function createHeaders() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  
  const headers = [
    'Временная метка',
    'Название',
    'Категория',
    'Метрика',
    'Описание',
    'Фото (base64)',
    'ID автора',
    'Имя автора'
  ];
  
  // Устанавливаем заголовки
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Форматируем заголовки
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');
  
  // Замораживаем первую строку
  sheet.setFrozenRows(1);
  
  return {
    message: 'Заголовки созданы',
    headers: headers
  };
}

/**
 * Тестовая функция для проверки работы скрипта
 */
function test() {
  const testData = {
    title: 'Тестовый опрос',
    category: 'Тестовая категория',
    metric: 'Тестовая метрика',
    description: 'Это тестовое описание',
    imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==',
    authorId: 'test-user-123',
    authorName: 'Тестовый пользователь'
  };
  
  const result = addSurveyData(testData);
  console.log('Результат теста:', result);
} 