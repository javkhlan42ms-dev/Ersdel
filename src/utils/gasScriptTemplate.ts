/**
 * Google Apps Script - All-in-One Backend Script Template
 * This script runs directly inside Google Sheets (Extensions -> Apps Script).
 * It requires NO Firebase, NO domain authorization, and works 100% reliably.
 */
export const GAS_ALL_IN_ONE_SCRIPT = `/**
 * ==============================================================================
 * СУРАЛЦАГЧИЙН АЮУЛГҮЙ БАЙДАЛ, ЭРСДЛИЙН ЦАХИМ ҮНЭЛГЭЭНИЙ СИСТЕМ
 * Google Apps Script Төв Өгөгдлийн Сан (All-in-One Backend)
 * ==============================================================================
 * Заавар:
 * 1. Энэ кодыг бүхлээр нь хуулж Google Sheet-ийн Extensions -> Apps Script цонхонд тавина.
 * 2. Дээр байрлах функцын сонголтоос "setupInitialSheets" гэснийг сонгоод "Run" (Ажиллуулах) дарна.
 * 3. Баруун дээд талын "Deploy" (Байрлуулах) -> "New deployment" сонгоно.
 * 4. Төрөл нь: "Web app"
 *    - Execute as: "Me" (Миний эрхээр)
 *    - Who has access: "Anyone" (Хүн бүр)
 * 5. Үүссэн Web app URL-ийг систем дэх "Google Apps Script Web App URL" талбарт хуулж тавина.
 */

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  try {
    var action = '';
    var payload = {};

    if (e && e.parameter && e.parameter.action) {
      action = e.parameter.action;
    }

    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
        if (payload.action) action = payload.action;
      } catch (err) {
        payload = {};
      }
    }

    var result = { success: false, message: 'Тодорхойгүй үйлдэл' };

    switch (action) {
      case 'login':
      case 'authenticate':
        result = handleUserLogin(payload, e);
        break;

      case 'registerStudent':
      case 'addStudent':
        result = registerStudentDirect(payload);
        break;

      case 'ping':
        result = {
          success: true,
          message: 'Google Apps Script өгөгдлийн сан хэвийн ажиллаж байна!',
          timestamp: new Date().toISOString()
        };
        break;

      case 'setupSheets':
        result = setupInitialSheets();
        break;

      case 'syncAllFromClient':
      case 'syncAll':
      case 'saveAllData':
      case 'sync':
      case 'saveAll':
      case 'syncFromClient':
        result = syncAllFromClient(payload);
        break;

      case 'getAllForClient':
      case 'getAllData':
      case 'loadAll':
      case 'loadAllFromGas':
        result = getAllForClient();
        break;

      case 'saveSurveyAnswers':
        result = saveStudentSurveyAnswers(payload);
        break;

      case 'importQuestions':
        result = importQuestionsFromData(payload.questions);
        break;

      case 'getSettings':
        result = { success: true, settings: getSystemSettings() };
        break;

      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 1-Дарж бүх 10 хүснэгтийг толгой, загвартай нь үүсгэх
 */
function setupInitialSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var sheetDefs = [
    {
      name: 'Тохиргоо',
      headers: ['Түлхүүр', 'Утга', 'Тайлбар', 'Шинэчилсэн огноо']
    },
    {
      name: 'Багш_Ангиуд',
      headers: ['Анги', 'Ангийн багшийн нэр', 'Багшийн код', 'Утас', 'Хичээлийн жил', 'Сургууль', 'Бүртгэсэн огноо']
    },
    {
      name: 'Сурагчид',
      headers: ['Сурагчийн код', 'Анги', 'Овог нэр', 'Хүйс', 'Нэвтрэх нууц үг', 'Төлөв', 'Эрсдлийн түвшин', 'Эрсдлийн оноо', 'Илгээсэн огноо', 'Шинэчилсэн огноо']
    },
    {
      name: 'Судалгааны_Хариултууд',
      headers: ['Огноо цаг', 'Сургууль', 'Хичээлийн жил', 'Анги', 'Сурагчийн код', 'Сурагчийн нэр', 'Эрсдэл', 'Оноо', 'Хариулсан асуултын тоо', 'Бүх хариулт (JSON)']
    },
    {
      name: 'Асуултууд',
      headers: ['Асуултын дугаар', 'Бүлэг', 'Асуултын текст', 'Төрөл', 'Хариултын хувилбарууд']
    },
    {
      name: 'Нэгдсэн_Дүн',
      headers: ['Анги', 'Нийт сурагч', 'Бөглөсөн', 'Хүлээгдэж буй', 'Хувь (%)', 'Энгийн', 'Дунд', 'Өндөр', 'Шинэчилсэн']
    },
    {
      name: 'Системийн_Лог',
      headers: ['Лог ID', 'Огноо цаг', 'Эрх', 'Хэрэглэгч', 'Үйлдэл', 'Тайлбар']
    }
  ];

  sheetDefs.forEach(function(def) {
    var sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
    }
    // Set headers if empty
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);
      sheet.getRange(1, 1, 1, def.headers.length)
        .setBackground('#1e293b')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });

  // Seed default settings if empty
  var setSheet = ss.getSheetByName('Тохиргоо');
  if (setSheet.getLastRow() <= 1) {
    setSheet.appendRow(['SchoolName', 'Хөвсгөл аймгийн 1-р сургууль', 'Сургуулийн нэр', new Date().toISOString()]);
    setSheet.appendRow(['AcademicYear', '2025-2026', 'Хичээлийн жил', new Date().toISOString()]);
    setSheet.appendRow(['SurveyOpen', 'true', 'Судалгаа нээлттэй эсэх', new Date().toISOString()]);
  }

  return { success: true, message: 'Бүх 7 хүснэгт амжилттай үүсэж бэлтгэгдлээ.' };
}

/**
 * Веб системээс ирсэн бүх өгөгдлийг Google Sheet-д хуулах (Синк)
 */
function syncAllFromClient(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupInitialSheets();

  var classes = payload.classes || [];
  var teachers = payload.teachers || [];
  var students = payload.students || [];
  var responses = payload.responses || {};
  var settings = payload.settings || {};

  // 1. Write Settings
  var setSheet = ss.getSheetByName('Тохиргоо');
  if (setSheet) {
    setSheet.clearContents();
    setSheet.getRange(1, 1, 1, 4).setValues([['Түлхүүр', 'Утга', 'Тайлбар', 'Шинэчилсэн огноо']]);
    setSheet.appendRow(['SchoolName', settings.schoolName || 'Сургууль', 'Сургуулийн нэр', new Date().toISOString()]);
    setSheet.appendRow(['AcademicYear', settings.academicYear || '2025-2026', 'Хичээлийн жил', new Date().toISOString()]);
    setSheet.appendRow(['SurveyOpen', String(settings.surveyOpen !== false), 'Судалгаа нээлттэй эсэх', new Date().toISOString()]);
    setSheet.getRange(1, 1, 1, 4).setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
  }

  // 2. Write Teachers & Classes
  var tcSheet = ss.getSheetByName('Багш_Ангиуд');
  if (tcSheet) {
    tcSheet.clearContents();
    var tcHeaders = ['Анги', 'Ангийн багшийн нэр', 'Багшийн код', 'Утас', 'Хичээлийн жил', 'Сургууль', 'Бүртгэсэн огноо'];
    var tcRows = [tcHeaders];

    classes.forEach(function(c) {
      var t = teachers.find(function(item) { return item.classId === c.id || item.className === c.name; });
      tcRows.push([
        c.name,
        t ? t.name : (c.teacherName || c.name + ' багш'),
        t ? t.teacherCode : c.teacherCode,
        t ? (t.phone || '') : '',
        c.academicYear || settings.academicYear || '2025-2026',
        c.schoolName || settings.schoolName || '',
        new Date().toLocaleDateString()
      ]);
    });

    if (tcRows.length > 0) {
      tcSheet.getRange(1, 1, tcRows.length, tcHeaders.length).setValues(tcRows);
      tcSheet.getRange(1, 1, 1, tcHeaders.length).setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
      tcSheet.setFrozenRows(1);
    }
  }

  // 3. Write Students
  var stSheet = ss.getSheetByName('Сурагчид');
  if (stSheet) {
    stSheet.clearContents();
    var stHeaders = ['Сурагчийн код', 'Анги', 'Овог нэр', 'Хүйс', 'Нэвтрэх нууц үг', 'Төлөв', 'Эрсдлийн түвшин', 'Эрсдлийн оноо', 'Илгээсэн огноо', 'Шинэчилсэн огноо'];
    var stRows = [stHeaders];

    students.forEach(function(s) {
      stRows.push([
        s.studentCode,
        s.className,
        s.fullName,
        s.gender === '1' ? 'Эм' : 'Эр',
        s.password,
        s.isSubmitted ? 'Судалгаа бөглөсөн' : 'Хүлээгдэж буй',
        s.riskLevel ? (s.riskLevel === 'high' ? 'Өндөр' : s.riskLevel === 'medium' ? 'Дунд' : 'Энгийн') : '-',
        s.riskScore != null ? s.riskScore : 0,
        s.submittedAt || '',
        new Date().toLocaleDateString()
      ]);
    });

    if (stRows.length > 0) {
      stSheet.getRange(1, 1, stRows.length, stHeaders.length).setValues(stRows);
      stSheet.getRange(1, 1, 1, stHeaders.length).setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
      stSheet.setFrozenRows(1);
    }
  }

  // 4. Write Survey Responses
  var resSheet = ss.getSheetByName('Судалгааны_Хариултууд');
  if (resSheet) {
    resSheet.clearContents();
    var resHeaders = ['Огноо цаг', 'Сургууль', 'Хичээлийн жил', 'Анги', 'Сурагчийн код', 'Сурагчийн нэр', 'Эрсдэл', 'Оноо', 'Хариулсан асуултын тоо', 'Бүх хариулт (JSON)'];
    var resRows = [resHeaders];

    students.filter(function(s) { return s.isSubmitted; }).forEach(function(s) {
      var ans = responses[s.id] || {};
      var ansCount = Object.keys(ans).length;
      resRows.push([
        s.submittedAt || new Date().toISOString(),
        settings.schoolName || '',
        settings.academicYear || '',
        s.className,
        s.studentCode,
        s.fullName,
        s.riskLevel === 'high' ? 'Өндөр' : s.riskLevel === 'medium' ? 'Дунд' : 'Энгийн',
        s.riskScore != null ? s.riskScore : 0,
        ansCount,
        JSON.stringify(ans)
      ]);
    });

    if (resRows.length > 0) {
      resSheet.getRange(1, 1, resRows.length, resHeaders.length).setValues(resRows);
      resSheet.getRange(1, 1, 1, resHeaders.length).setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
      resSheet.setFrozenRows(1);
    }
  }

  return {
    success: true,
    message: 'Бүх өгөгдөл Google Sheet рүү амжилттай синк хийгдлээ (' + classes.length + ' анги, ' + students.length + ' сурагч).'
  };
}

/**
 * Google Sheet-ээс бүх өгөгдлийг уншиж веб систем рүү буцаах
 */
function getAllForClient() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var classes = [];
  var teachers = [];
  var students = [];
  var responses = {};
  var settings = {};

  // 1. Read Settings
  var setSheet = ss.getSheetByName('Тохиргоо');
  if (setSheet && setSheet.getLastRow() > 1) {
    var setData = setSheet.getDataRange().getValues();
    for (var i = 1; i < setData.length; i++) {
      var k = String(setData[i][0]).trim();
      var v = setData[i][1];
      if (k === 'SchoolName') settings.schoolName = v;
      if (k === 'AcademicYear') settings.academicYear = v;
      if (k === 'SurveyOpen') settings.surveyOpen = String(v).toLowerCase() === 'true';
    }
  }

  // 2. Read Classes & Teachers
  var tcSheet = ss.getSheetByName('Багш_Ангиуд');
  if (tcSheet && tcSheet.getLastRow() > 1) {
    var tcData = tcSheet.getDataRange().getValues();
    for (var cIdx = 1; cIdx < tcData.length; cIdx++) {
      var row = tcData[cIdx];
      var cName = String(row[0] || '').trim();
      if (!cName) continue;

      var tName = String(row[1] || cName + ' багш').trim();
      var tCode = String(row[2] || 'TEACH-' + cName).trim();
      var phone = String(row[3] || '').trim();
      var year = String(row[4] || settings.academicYear || '2025-2026').trim();
      var school = String(row[5] || settings.schoolName || '').trim();

      var gradeMatch = cName.match(/^(\\d+)/);
      var grade = gradeMatch ? parseInt(gradeMatch[1], 10) : 7;
      var sec = cName.replace(/^[\\d\\s\\-_]+/, '').trim() || 'А';

      var cId = 'CLS_' + cName.replace(/[^0-9A-Za-z]/g, '') + '_' + cIdx;
      var tId = 'TCH_' + cName.replace(/[^0-9A-Za-z]/g, '') + '_' + cIdx;

      classes.push({
        id: cId,
        name: cName,
        grade: grade,
        sectionLetter: sec,
        teacherId: tId,
        teacherName: tName,
        teacherCode: tCode,
        academicYear: year,
        schoolName: school
      });

      teachers.push({
        id: tId,
        name: tName,
        teacherCode: tCode,
        classId: cId,
        className: cName,
        phone: phone
      });
    }
  }

  // 3. Read Students
  var stSheet = ss.getSheetByName('Сурагчид');
  if (stSheet && stSheet.getLastRow() > 1) {
    var stData = stSheet.getDataRange().getValues();
    for (var sIdx = 1; sIdx < stData.length; sIdx++) {
      var sRow = stData[sIdx];
      var sCode = String(sRow[0] || '').trim();
      var sClass = String(sRow[1] || '').trim();
      var sName = String(sRow[2] || '').trim();
      if (!sCode || !sName) continue;

      var sGender = String(sRow[3] || '').toLowerCase().indexOf('эм') >= 0 ? '1' : '2';
      var sPass = String(sRow[4] || '123456').trim();
      var sSub = String(sRow[5] || '').indexOf('бөглөсөн') >= 0 || Boolean(sRow[8]);
      var sRiskText = String(sRow[6] || '').trim();
      var sRiskLevel = undefined;
      if (sRiskText.indexOf('Өндөр') >= 0) sRiskLevel = 'high';
      else if (sRiskText.indexOf('Дунд') >= 0) sRiskLevel = 'medium';
      else if (sRiskText.indexOf('Энгийн') >= 0) sRiskLevel = 'low';

      var sScore = parseInt(sRow[7] || '0', 10) || 0;
      var sDate = sRow[8] ? String(sRow[8]) : undefined;

      var matchCls = classes.find(function(item) { return item.name === sClass; });
      var classId = matchCls ? matchCls.id : 'CLS_' + sClass;

      students.push({
        id: 'STU_' + sCode,
        classId: classId,
        className: sClass,
        studentCode: sCode,
        password: sPass,
        fullName: sName,
        gender: sGender,
        isSubmitted: sSub,
        submittedAt: sDate,
        riskLevel: sRiskLevel,
        riskScore: sScore
      });
    }
  }

  // 4. Read Responses
  var resSheet = ss.getSheetByName('Судалгааны_Хариултууд');
  if (resSheet && resSheet.getLastRow() > 1) {
    var resData = resSheet.getDataRange().getValues();
    for (var rIdx = 1; rIdx < resData.length; rIdx++) {
      var rRow = resData[rIdx];
      var code = String(rRow[4] || '').trim();
      var jsonStr = rRow[9];
      if (code && jsonStr) {
        try {
          responses['STU_' + code] = JSON.parse(jsonStr);
        } catch (e) {}
      }
    }
  }

  return {
    success: true,
    classes: classes,
    teachers: teachers,
    students: students,
    responses: responses,
    settings: settings
  };
}

/**
 * Сурагч судалгаа бөглөх үед Google Sheet-д бичих (Concurrency lock & Duplicate protection)
 */
function saveStudentSurveyAnswers(payload) {
  var lock = LockService.getScriptLock();
  var hasLock = false;
  try {
    hasLock = lock.waitLock(30000);
  } catch (e) {
    return { success: false, message: 'Google Sheet ачаалалтай байна. Түр хүлээгээд дахин илгээнэ үү.' };
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var student = payload.student || {};
    var answers = payload.answers || {};
    var studentCode = String(payload.studentCode || student.studentCode || '').trim();
    var className = String(payload.className || student.className || '').trim();
    var fullName = String(payload.fullName || student.fullName || '').trim();
    var riskLevel = payload.riskLevel || student.riskLevel || 'low';
    var riskScore = payload.riskScore != null ? payload.riskScore : (student.riskScore || 0);

    if (!studentCode) {
      if (hasLock) lock.releaseLock();
      return { success: false, message: 'Сурагчийн код тодорхойгүй байна.' };
    }

    var resSheet = ss.getSheetByName('Судалгааны_Хариултууд');
    if (!resSheet) {
      setupInitialSheets();
      resSheet = ss.getSheetByName('Судалгааны_Хариултууд');
    }

    var now = new Date().toISOString();
    var ansCount = Object.keys(answers).length;
    var upperCode = studentCode.toUpperCase();

    // Check if student already submitted - update existing row to avoid duplicates
    var resLastRow = resSheet.getLastRow();
    var existingRowIndex = -1;
    if (resLastRow > 1) {
      var existingData = resSheet.getDataRange().getValues();
      for (var r = 1; r < existingData.length; r++) {
        var rowCode = String(existingData[r][4] || '').trim().toUpperCase();
        if (rowCode === upperCode) {
          existingRowIndex = r + 1;
          break;
        }
      }
    }

    var riskText = riskLevel === 'high' ? 'Өндөр' : riskLevel === 'medium' ? 'Дунд' : 'Энгийн';
    var answersJson = JSON.stringify(answers);

    if (existingRowIndex > 0) {
      resSheet.getRange(existingRowIndex, 1).setValue(now);
      resSheet.getRange(existingRowIndex, 4).setValue(className);
      resSheet.getRange(existingRowIndex, 6).setValue(fullName);
      resSheet.getRange(existingRowIndex, 7).setValue(riskText);
      resSheet.getRange(existingRowIndex, 8).setValue(riskScore);
      resSheet.getRange(existingRowIndex, 9).setValue(ansCount);
      resSheet.getRange(existingRowIndex, 10).setValue(answersJson);
    } else {
      resSheet.appendRow([
        now,
        '',
        '',
        className,
        studentCode,
        fullName,
        riskText,
        riskScore,
        ansCount,
        answersJson
      ]);
    }

    // Update in Students sheet if exists
    var stSheet = ss.getSheetByName('Сурагчид');
    if (stSheet && stSheet.getLastRow() > 1) {
      var sData = stSheet.getDataRange().getValues();
      for (var i = 1; i < sData.length; i++) {
        if (String(sData[i][0]).trim().toUpperCase() === upperCode) {
          stSheet.getRange(i + 1, 6).setValue('Судалгаа бөглөсөн');
          stSheet.getRange(i + 1, 7).setValue(riskText);
          stSheet.getRange(i + 1, 8).setValue(riskScore);
          stSheet.getRange(i + 1, 9).setValue(now);
          break;
        }
      }
    }

    if (hasLock) lock.releaseLock();
    return {
      success: true,
      message: 'Судалгааны хариулт Google Sheet-д амжилттай хадгалагдлаа.',
      submittedAt: now
    };
  } catch (err) {
    if (hasLock) {
      try { lock.releaseLock(); } catch(e){}
    }
    return { success: false, error: err.toString() };
  }
}

/**
 * Төв Google Sheet сангаас бодит цагт хэрэглэгч нэвтрүүлэх (All Devices Login)
 */
function handleUserLogin(payload, e) {
  var params = (payload && Object.keys(payload).length > 0) ? payload : (e && e.parameter ? e.parameter : {});
  var username = String(params.username || params.studentCode || params.code || '').trim();
  var password = String(params.password || '').trim();
  var requestedRole = String(params.role || '').toLowerCase().trim();

  if (!username) {
    return { success: false, message: 'Нэвтрэх код оруулна уу.' };
  }

  var normInput = normalizeCode(username);
  var upperInput = username.toUpperCase();
  var cleanPassword = password.toUpperCase();

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Сурагч шалгах (Сурагчид хүснэгт)
  if (requestedRole === 'student' || !requestedRole || requestedRole === 'user') {
    var stSheet = ss.getSheetByName('Сурагчид');
    if (stSheet && stSheet.getLastRow() > 1) {
      var stData = stSheet.getDataRange().getValues();
      for (var sIdx = 1; sIdx < stData.length; sIdx++) {
        var sRow = stData[sIdx];
        var sCode = String(sRow[0] || '').trim();
        if (!sCode) continue;

        var sNorm = normalizeCode(sCode);
        var sUpper = sCode.toUpperCase();
        var sPass = String(sRow[4] || '123456').trim().toUpperCase();

        if (sUpper === upperInput || sNorm === normInput) {
          // Check password - strictly required and must match
          if (!cleanPassword || sPass !== cleanPassword) {
            return { success: false, message: 'Нэвтрэх нууц үг буруу байна.' };
          }

          var sClass = String(sRow[1] || '').trim();
          var sName = String(sRow[2] || '').trim();
          var sGender = String(sRow[3] || '').toLowerCase().indexOf('эм') >= 0 ? '1' : '2';
          var sSub = String(sRow[5] || '').indexOf('бөглөсөн') >= 0 || Boolean(sRow[8]);
          var sRiskText = String(sRow[6] || '').trim();
          var sRiskLevel = sRiskText.indexOf('Өндөр') >= 0 ? 'high' : (sRiskText.indexOf('Дунд') >= 0 ? 'medium' : (sRiskText.indexOf('Энгийн') >= 0 ? 'low' : undefined));
          var sScore = parseInt(sRow[7] || '0', 10) || 0;
          var sDate = sRow[8] ? String(sRow[8]) : undefined;

          return {
            success: true,
            role: 'student',
            user: {
              user_id: 'STU_' + sCode,
              id: 'STU_' + sCode,
              username: sCode,
              studentCode: sCode,
              student_id: sCode,
              fullName: sName,
              student_name: sName,
              className: sClass,
              class: sClass,
              classId: 'CLS_' + sClass,
              gender: sGender,
              role: 'student',
              status: 'active',
              isSubmitted: sSub,
              submittedAt: sDate,
              riskLevel: sRiskLevel,
              riskScore: sScore
            }
          };
        }
      }
    }
  }

  // 2. Ангийн багш шалгах (Багш_Ангиуд хүснэгт)
  if (requestedRole === 'teacher' || !requestedRole || requestedRole === 'user') {
    var tchSheet = ss.getSheetByName('Багш_Ангиуд');
    if (tchSheet && tchSheet.getLastRow() > 1) {
      var tchData = tchSheet.getDataRange().getValues();
      var rawDigits = username.replace(/[^0-9]/g, '');

      for (var tIdx = 1; tIdx < tchData.length; tIdx++) {
        var tRow = tchData[tIdx];
        var cName = String(tRow[0] || '').trim();
        var tName = String(tRow[1] || '').trim();
        var tCode = String(tRow[2] || '').trim();
        var phone = String(tRow[3] || '').trim();
        var phoneDigits = phone.replace(/[^0-9]/g, '');

        var tCodeNorm = normalizeCode(tCode);
        var cNameNorm = normalizeCode(cName);

        var matched = (
          tCode.toUpperCase() === upperInput ||
          tCodeNorm === normInput ||
          cName.toUpperCase() === upperInput ||
          cNameNorm === normInput ||
          (rawDigits.length >= 6 && phoneDigits === rawDigits)
        );

        if (matched) {
          return {
            success: true,
            role: 'teacher',
            user: {
              user_id: 'TCH_' + (tCode || cName),
              id: 'TCH_' + (tCode || cName),
              username: tCode || cName,
              teacherCode: tCode || 'TEACH-' + cName,
              name: tName || 'Ангийн багш',
              fullName: tName || 'Ангийн багш',
              className: cName,
              class: cName,
              classId: 'CLS_' + cName,
              phone: phone,
              role: 'teacher',
              status: 'active'
            }
          };
        }
      }
    }
  }

  return {
    success: false,
    message: 'Хэрэглэгчийн код эсвэл нууц үг буруу байна.'
  };
}

/**
 * Шинэ сурагчийг төв Google Sheet-д бүртгэх (Concurrency lock & Duplicate check)
 */
function registerStudentDirect(payload) {
  var lock = LockService.getScriptLock();
  var hasLock = false;
  try {
    hasLock = lock.waitLock(30000);
  } catch (e) {
    return { success: false, message: 'Google Sheet ачаалалтай байна. Түр хүлээгээд дахин оролдоно уу.' };
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var stSheet = ss.getSheetByName('Сурагчид');
    if (!stSheet) {
      setupInitialSheets();
      stSheet = ss.getSheetByName('Сурагчид');
    }

    var studentCode = String(payload.studentCode || payload.username || '').trim();
    var className = String(payload.className || payload.class || '').trim();
    var fullName = String(payload.fullName || payload.name || '').trim();
    var gender = String(payload.gender || '1').trim();
    var password = String(payload.password || '123456').trim();
    var genderText = (gender === '1' || gender.toLowerCase().indexOf('эм') >= 0) ? 'Эмэгтэй' : 'Эрэгтэй';

    if (!studentCode) {
      if (hasLock) lock.releaseLock();
      return { success: false, message: 'Сурагчийн код хоосон байна.' };
    }
    if (!fullName) {
      if (hasLock) lock.releaseLock();
      return { success: false, message: 'Сурагчийн нэр хоосон байна.' };
    }

    var upperCode = studentCode.toUpperCase();
    var normCode = normalizeCode(studentCode);

    // Давхардлыг шалгах
    var lastRow = stSheet.getLastRow();
    if (lastRow > 1) {
      var data = stSheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < data.length; i++) {
        var existing = String(data[i][0] || '').trim();
        if (existing.toUpperCase() === upperCode || normalizeCode(existing) === normCode) {
          if (hasLock) lock.releaseLock();
          return {
            success: false,
            message: 'Энэ хэрэглэгчийн нэр/код (' + studentCode + ') аль хэдийн бүртгэгдсэн байна.'
          };
        }
      }
    }

    var now = new Date().toISOString();
    stSheet.appendRow([
      studentCode,
      className,
      fullName,
      genderText,
      password,
      'Хүлээгдэж буй',
      '',
      '',
      '',
      now
    ]);

    if (hasLock) lock.releaseLock();

    return {
      success: true,
      message: 'Сурагч амжилттай бүртгэгдлээ.',
      student: {
        id: 'STU_' + studentCode,
        classId: 'CLS_' + className,
        className: className,
        studentCode: studentCode,
        password: password,
        fullName: fullName,
        gender: gender,
        isSubmitted: false,
        status: 'active'
      }
    };
  } catch (err) {
    if (hasLock) {
      try { lock.releaseLock(); } catch(e){}
    }
    return { success: false, error: err.toString() };
  }
}

/**
 * Крилл болон Латин үсгийн ижил төстэй тэмдэгтүүдийг стандартчилж харьцуулах туслах функц
 */
function normalizeCode(str) {
  if (!str) return '';
  var s = String(str).trim().toUpperCase();
  var map = {
    'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H', 'К': 'K',
    'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T', 'Х': 'X', 'У': 'Y'
  };
  var res = '';
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    res += map[ch] || ch;
  }
  return res.replace(/[^A-Z0-9]/g, '');
}

/**
 * Асуултуудыг хүснэгтэд оруулах
 */
function importQuestionsFromData(questions) {
  if (!questions || !questions.length) return { success: false, error: 'Хоосон асуулт' };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Асуултууд');
  if (!sheet) {
    setupInitialSheets();
    sheet = ss.getSheetByName('Асуултууд');
  }

  sheet.clearContents();
  var headers = ['Асуултын дугаар', 'Бүлэг', 'Асуултын текст', 'Төрөл', 'Хариултын хувилбарууд'];
  var rows = [headers];

  questions.forEach(function(q) {
    rows.push([
      q.id || '',
      q.section || '',
      q.question || '',
      q.type || '',
      q.options ? JSON.stringify(q.options) : ''
    ]);
  });

  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
  sheet.getRange(1, 1, 1, headers.length).setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
  return { success: true, count: questions.length };
}

function getSystemSettings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Тохиргоо');
  var settings = { schoolName: 'Сургууль 2026', academicYear: '2025-2026', surveyOpen: true };
  if (!sheet || sheet.getLastRow() <= 1) return settings;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var k = String(data[i][0]).trim();
    if (k === 'SchoolName') settings.schoolName = data[i][1];
    if (k === 'AcademicYear') settings.academicYear = data[i][1];
    if (k === 'SurveyOpen') settings.surveyOpen = String(data[i][1]).toLowerCase() === 'true';
  }
  return settings;
}
`;
