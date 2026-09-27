/**
 * Security.gs - Server-Side Authorization, Tokens, Audit Logging, Privacy Protection
 */

function generateSecureToken(role, userId, classId) {
  var raw = role + ':' + userId + ':' + (classId || '') + ':' + new Date().getTime();
  return Utilities.base64Encode(raw);
}

function verifyToken(token) {
  if (!token) return { valid: false };
  try {
    var decoded = Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString();
    var parts = decoded.split(':');
    if (parts.length >= 3) {
      return {
        valid: true,
        role: parts[0],
        userId: parts[1],
        classId: parts[2]
      };
    }
  } catch (e) {
    return { valid: false };
  }
  return { valid: false };
}

function logSystemAction(userRole, userName, action, details) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logsSheet = ss.getSheetByName('Logs');
    if (!logsSheet) return;

    var logId = 'LOG_' + new Date().getTime();
    var now = new Date().toISOString();
    logsSheet.appendRow([logId, now, userRole, userName, action, details]);
  } catch (err) {
    console.error('Log error:', err);
  }
}

function getSystemSettings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Settings');
  var settings = {
    schoolName: 'Сургууль 2026',
    academicYear: '2025-2026',
    surveyOpen: true
  };

  if (!sheet) return settings;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === 'SchoolName') settings.schoolName = data[i][1];
    if (data[i][0] === 'AcademicYear') settings.academicYear = data[i][1];
    if (data[i][0] === 'SurveyOpen') settings.surveyOpen = String(data[i][1]).toLowerCase() === 'true';
  }
  return settings;
}

function toggleSurveyOpen(isOpen, token) {
  var auth = verifyToken(token);
  if (!auth.valid || auth.role !== 'admin') {
    return { success: false, error: 'Зөвхөн админ судалгааны төлөвийг өөрчлөх боломжтой.' };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Settings');
  var data = sheet.getDataRange().getValues();
  var found = false;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === 'SurveyOpen') {
      sheet.getRange(i + 1, 2).setValue(String(isOpen));
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow(['SurveyOpen', String(isOpen), 'Судалгаа нээлттэй эсэх', new Date().toISOString()]);
  }

  logSystemAction('ADMIN', auth.userId, 'TOGGLE_SURVEY', 'Судалгааны төлөв: ' + (isOpen ? 'Нээлттэй' : 'Хаалттай'));
  return { success: true, surveyOpen: isOpen };
}

function getClassesList() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Classes');
  if (!sheet) return { success: true, classes: [] };

  var data = sheet.getDataRange().getValues();
  var classes = [];
  for (var i = 1; i < data.length; i++) {
    classes.push({
      id: data[i][0],
      name: data[i][1],
      grade: data[i][2],
      sectionLetter: data[i][3],
      teacherCode: data[i][4],
      academicYear: data[i][5],
      schoolName: data[i][6]
    });
  }
  return { success: true, classes: classes };
}

function createNewClass(payload) {
  var auth = verifyToken(payload.token);
  if (!auth.valid || auth.role !== 'admin') {
    return { success: false, error: 'Зөвхөн админ анги үүсгэх боломжтой.' };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var classSheet = ss.getSheetByName('Classes');
  var teacherSheet = ss.getSheetByName('Teachers');

  var className = (payload.name || '').trim();
  var grade = payload.grade || 7;
  var sectionLetter = (payload.sectionLetter || 'А').trim();
  var schoolName = payload.schoolName || 'Сургууль';
  var academicYear = payload.academicYear || '2025-2026';
  var teacherName = payload.teacherName || 'Багш';

  var classId = 'CLS_' + className.replace(/[^0-9a-zA-Z]/g, '') + '_' + new Date().getTime();
  var teacherCode = payload.teacherCode || ('TEACH-' + className.replace(/[^0-9a-zA-Z]/g, ''));
  var now = new Date().toISOString();

  classSheet.appendRow([
    classId,
    className,
    grade,
    sectionLetter,
    teacherCode,
    academicYear,
    schoolName,
    now
  ]);

  var teacherId = 'TCH_' + new Date().getTime();
  teacherSheet.appendRow([
    teacherId,
    teacherCode,
    teacherName,
    classId,
    className,
    payload.phone || '',
    now
  ]);

  logSystemAction('ADMIN', auth.userId, 'CREATE_CLASS', className + ' анги болон багшийн код (' + teacherCode + ') үүсгэв.');

  return {
    success: true,
    classData: {
      id: classId,
      name: className,
      grade: grade,
      sectionLetter: sectionLetter,
      teacherCode: teacherCode,
      academicYear: academicYear,
      schoolName: schoolName
    }
  };
}
