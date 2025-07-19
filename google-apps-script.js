// Google Apps Script для работы с Google Sheets как базой данных
// Развертывание: Extensions -> Apps Script -> Deploy -> New Deployment -> Web app

// ID вашей таблицы
const SPREADSHEET_ID = '1PHrQ8ZwjrOc4_9QuvpQltuMpuSUGIlcb96lp6korbTA';

// Обработка GET запросов
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch (action) {
      case 'ping':
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Google Sheets API работает'
        })).setMimeType(ContentService.MimeType.JSON);
        
      case 'getProblems':
        return getProblems();
        
      case 'getUsers':
        return getUsers();
        
      default:
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          message: 'Неизвестное действие'
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Обработка POST запросов
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch (action) {
      case 'addSurvey':
        return addSurvey(data.data);
        
      case 'updateUser':
        return updateUser(data.userId, data.updates);
        
      case 'addBonusPoints':
        return addBonusPoints(data.problemId, data.bonusPoints, data.adminId);
        
      case 'syncAllData':
        return syncAllData(data.problems, data.users);
        
      default:
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          message: 'Неизвестное действие'
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Добавить данные опроса
function addSurvey(surveyData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Лист1');
  
  // Проверяем заголовки
  if (sheet.getLastRow() === 0) {
    createHeaders(sheet);
  }
  
  // Добавляем данные
  sheet.appendRow([
    surveyData.timestamp || new Date().toISOString(),
    surveyData.title || '',
    surveyData.category || '',
    surveyData.metric || '',
    surveyData.description || '',
    surveyData.imageBase64 || '',
    surveyData.authorId || '',
    surveyData.authorName || '',
    1, // points
    'pending', // status
    false // reviewed
  ]);
  
  // Обновляем данные пользователя
  updateUserStats(surveyData.authorId, surveyData.authorName, 1, 1);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Данные добавлены'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Создать заголовки для листа проблем
function createHeaders(sheet) {
  const headers = [
    'Timestamp',
    'Title',
    'Category',
    'Metric',
    'Description',
    'ImageBase64',
    'AuthorId',
    'AuthorName',
    'Points',
    'Status',
    'Reviewed'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
}

// Получить все проблемы
function getProblems() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Лист1');
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      problems: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const problems = [];
  for (let i = 1; i < data.length; i++) {
    problems.push({
      id: 'problem_' + i,
      title: data[i][1],
      description: data[i][4],
      category: data[i][2],
      authorId: data[i][6],
      authorName: data[i][7],
      images: data[i][5] ? [data[i][5]] : [],
      points: data[i][8] || 1,
      status: data[i][9] || 'pending',
      reviewed: data[i][10] || false,
      createdAt: data[i][0]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    problems: problems
  })).setMimeType(ContentService.MimeType.JSON);
}

// Получить всех пользователей
function getUsers() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Users');
  
  // Создаем лист Users если его нет
  if (!sheet) {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const newSheet = spreadsheet.insertSheet('Users');
    newSheet.appendRow(['UserId', 'Email', 'FullName', 'TotalPoints', 'TotalProblems', 'Level', 'JoinedAt', 'LastActive']);
    newSheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      users: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      users: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const users = [];
  for (let i = 1; i < data.length; i++) {
    users.push({
      id: data[i][0],
      email: data[i][1],
      fullName: data[i][2],
      totalPoints: data[i][3] || 0,
      totalProblems: data[i][4] || 0,
      level: data[i][5] || 'novice',
      joinedAt: data[i][6],
      lastActive: data[i][7]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    users: users
  })).setMimeType(ContentService.MimeType.JSON);
}

// Обновить статистику пользователя
function updateUserStats(userId, userName, pointsDelta, problemsDelta) {
  let sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Users');
  
  // Создаем лист Users если его нет
  if (!sheet) {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    sheet = spreadsheet.insertSheet('Users');
    sheet.appendRow(['UserId', 'Email', 'FullName', 'TotalPoints', 'TotalProblems', 'Level', 'JoinedAt', 'LastActive']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
  }
  
  const data = sheet.getDataRange().getValues();
  let userRow = -1;
  
  // Ищем пользователя
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      userRow = i + 1; // +1 потому что индексация в Sheets начинается с 1
      break;
    }
  }
  
  if (userRow === -1) {
    // Создаем нового пользователя
    sheet.appendRow([
      userId,
      '', // email
      userName || 'Пользователь',
      pointsDelta,
      problemsDelta,
      'novice',
      new Date().toISOString(),
      new Date().toISOString()
    ]);
  } else {
    // Обновляем существующего
    const currentPoints = sheet.getRange(userRow, 4).getValue() || 0;
    const currentProblems = sheet.getRange(userRow, 5).getValue() || 0;
    const newPoints = currentPoints + pointsDelta;
    const newProblems = currentProblems + problemsDelta;
    
    // Определяем уровень
    let level = 'novice';
    if (newPoints >= 10) level = 'master';
    else if (newPoints >= 5) level = 'fighter';
    
    sheet.getRange(userRow, 4).setValue(newPoints);
    sheet.getRange(userRow, 5).setValue(newProblems);
    sheet.getRange(userRow, 6).setValue(level);
    sheet.getRange(userRow, 8).setValue(new Date().toISOString());
  }
}

// Добавить бонусные баллы
function addBonusPoints(problemId, bonusPoints, adminId) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Лист1');
  const data = sheet.getDataRange().getValues();
  
  // Находим проблему по ID
  const rowIndex = parseInt(problemId.replace('problem_', ''));
  if (rowIndex > 0 && rowIndex < data.length) {
    const currentPoints = sheet.getRange(rowIndex + 1, 9).getValue() || 1;
    const newPoints = currentPoints + bonusPoints;
    sheet.getRange(rowIndex + 1, 9).setValue(newPoints);
    
    // Обновляем баллы пользователя
    const authorId = data[rowIndex][6];
    const authorName = data[rowIndex][7];
    updateUserStats(authorId, authorName, bonusPoints, 0);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Бонусные баллы добавлены'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'error',
    message: 'Проблема не найдена'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Синхронизировать все данные
function syncAllData(problems, users) {
  try {
    // Очищаем и заполняем лист проблем
    const problemsSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Лист1');
    problemsSheet.clear();
    createHeaders(problemsSheet);
    
    problems.forEach(problem => {
      problemsSheet.appendRow([
        problem.createdAt,
        problem.title,
        problem.category,
        'Проблема ПНР',
        problem.description,
        problem.images[0] || '',
        problem.authorId,
        problem.authorName,
        problem.points,
        problem.status,
        problem.reviewed
      ]);
    });
    
    // Очищаем и заполняем лист пользователей
    let usersSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Users');
    if (!usersSheet) {
      const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      usersSheet = spreadsheet.insertSheet('Users');
    }
    
    usersSheet.clear();
    usersSheet.appendRow(['UserId', 'Email', 'FullName', 'TotalPoints', 'TotalProblems', 'Level', 'JoinedAt', 'LastActive']);
    usersSheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    
    users.forEach(user => {
      usersSheet.appendRow([
        user.id,
        user.email,
        user.fullName,
        user.totalPoints,
        user.totalProblems,
        user.level,
        user.joinedAt,
        user.lastActive
      ]);
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Данные синхронизированы'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
} 