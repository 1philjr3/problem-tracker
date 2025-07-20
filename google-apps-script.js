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
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Google Sheets API работает!',
      spreadsheetId: SPREADSHEET_ID,
      timestamp: new Date().toISOString(),
      userAgent: e.parameter.userAgent || 'Unknown'
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * Обработчик POST запросов
 */
function doPost(e) {
  try {
    // Логируем информацию о запросе
    console.log('📱 Получен запрос:', new Date().toISOString());
    console.log('📋 Данные запроса:', e.postData ? e.postData.contents : 'Нет данных');
    
    // Парсим входящие данные
    if (!e.postData || !e.postData.contents) {
      throw new Error('Нет данных в запросе');
    }
    
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const data = requestData.data;
    
    console.log('🎯 Действие:', action);
    
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
    
    console.log('✅ Обработка завершена успешно');
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        result: result,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
  } catch (error) {
    console.error('❌ Ошибка обработки запроса:', error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  }
}

/**
 * Обработчик OPTIONS запросов (для CORS)
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * Добавляет новую строку с данными опроса
 */
function addSurveyData(data) {
  try {
    console.log('📝 Начинаем добавление данных опроса...');
    console.log('📋 Данные:', JSON.stringify(data, null, 2));
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Лист "' + SHEET_NAME + '" не найден');
    }
    
    // ВСЕГДА проверяем и создаем заголовки если нужно
    const lastRow = sheet.getLastRow();
    console.log('📊 Текущая последняя строка:', lastRow);
    
    if (lastRow === 0) {
      console.log('📊 Лист пустой, создаем заголовки...');
      createHeaders();
    } else {
      // Проверяем, есть ли заголовки в первой строке
      const firstRowValues = sheet.getRange(1, 1, 1, 8).getValues()[0];
      const hasHeaders = firstRowValues[0] && (
        firstRowValues[0].toString().includes('Дата') || 
        firstRowValues[0].toString().includes('время') ||
        firstRowValues[0] === 'Дата и время'
      );
      
      if (!hasHeaders) {
        console.log('📊 Заголовки отсутствуют, создаем...');
        // Вставляем строку в начало
        sheet.insertRowBefore(1);
        createHeaders();
      }
    }
    
    // Добавляем временную метку, если её нет
    if (!data.timestamp) {
      data.timestamp = new Date().toLocaleString('ru-RU');
    }
    
    // Переводим названия на русский
    const categoryRussian = CATEGORY_NAMES[data.category] || data.category;
    const metricRussian = METRIC_NAMES[data.metric] || data.metric;
    
    console.log('🔄 Переводим категорию:', data.category, '→', categoryRussian);
    console.log('🔄 Переводим метрику:', data.metric, '→', metricRussian);
    
    // Подготавливаем данные для вставки
    const row = [
      data.timestamp,
      data.title || '',
      categoryRussian,
      metricRussian,
      data.description || '',
      data.imageBase64 || '', // URL изображения или base64
      data.authorId || '',
      data.authorName || ''
    ];
    
    console.log('📝 Готовим строку для вставки...');
    
    // Добавляем строку в таблицу
    sheet.appendRow(row);
    
    const rowNumber = sheet.getLastRow();
    console.log('✅ Данные успешно добавлены в строку:', rowNumber);
    
    // Если есть изображение (URL), делаем ячейку кликабельной
    if (data.imageBase64 && data.imageBase64.startsWith('http')) {
      try {
        const imageCell = sheet.getRange(rowNumber, 6); // Столбец F (фотография)
        imageCell.setFormula('=HYPERLINK("' + data.imageBase64 + '","🖼️ Просмотреть фото")');
        console.log('🖼️ Добавлена ссылка на изображение');
      } catch (linkError) {
        console.warn('⚠️ Не удалось создать ссылку на изображение:', linkError.toString());
      }
    }
    
    return {
      message: 'Данные успешно добавлены',
      rowNumber: rowNumber,
      timestamp: new Date().toISOString(),
      categoryRussian: categoryRussian,
      metricRussian: metricRussian,
      hasHeaders: true
    };
    
  } catch (error) {
    console.error('❌ Ошибка при добавлении данных:', error.toString());
    throw new Error('Не удалось добавить данные в таблицу: ' + error.toString());
  }
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
    imageUrl: row[5], // Теперь это URL
    authorId: row[6],
    authorName: row[7]
  }));
}

/**
 * Создает заголовки столбцов на русском языке
 */
function createHeaders() {
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
  
  // Устанавливаем заголовки
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Форматируем заголовки
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');
  
  // Замораживаем первую строку
  sheet.setFrozenRows(1);
  
  // Устанавливаем ширину столбцов
  sheet.setColumnWidth(1, 150); // Дата и время
  sheet.setColumnWidth(2, 200); // Название проблемы
  sheet.setColumnWidth(3, 120); // Категория
  sheet.setColumnWidth(4, 120); // Метрика
  sheet.setColumnWidth(5, 300); // Описание
  sheet.setColumnWidth(6, 200); // Фотография
  sheet.setColumnWidth(7, 100); // ID пользователя
  sheet.setColumnWidth(8, 150); // Имя пользователя
  
  return {
    message: 'Заголовки созданы на русском языке',
    headers: headers
  };
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