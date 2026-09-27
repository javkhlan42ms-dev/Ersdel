/**
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
        result = syncAllFromClient(payload);
        break;

      case 'getAllForClient':
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
 * 1-Дарж бүх хүснэгтүүдийг толгой, загвартай нь үүсгэх
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

      var gradeMatch = cName.match(/^(\d+)/);
      var grade = gradeMatch ? parseInt(gradeMatch[1], 10) : 7;
      var sec = cName.replace(/^[\d\s\-_]+/, '').trim() || 'А';

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
 * Сурагч судалгаа бөглөх үед Google Sheet-д бичих
 */
function saveStudentSurveyAnswers(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var student = payload.student || {};
  var answers = payload.answers || {};
  var studentCode = payload.studentCode || student.studentCode || '';
  var className = payload.className || student.className || '';
  var fullName = payload.fullName || student.fullName || '';
  var riskLevel = payload.riskLevel || student.riskLevel || 'low';
  var riskScore = payload.riskScore != null ? payload.riskScore : (student.riskScore || 0);

  var resSheet = ss.getSheetByName('Судалгааны_Хариултууд');
  if (!resSheet) {
    setupInitialSheets();
    resSheet = ss.getSheetByName('Судалгааны_Хариултууд');
  }

  var now = new Date().toISOString();
  var ansCount = Object.keys(answers).length;

  resSheet.appendRow([
    now,
    '',
    '',
    className,
    studentCode,
    fullName,
    riskLevel === 'high' ? 'Өндөр' : riskLevel === 'medium' ? 'Дунд' : 'Энгийн',
    riskScore,
    ansCount,
    JSON.stringify(answers)
  ]);

  // Update in Students sheet if exists
  var stSheet = ss.getSheetByName('Сурагчид');
  if (stSheet && stSheet.getLastRow() > 1) {
    var sData = stSheet.getDataRange().getValues();
    for (var i = 1; i < sData.length; i++) {
      if (String(sData[i][0]).trim() === studentCode) {
        stSheet.getRange(i + 1, 6).setValue('Судалгаа бөглөсөн');
        stSheet.getRange(i + 1, 7).setValue(riskLevel === 'high' ? 'Өндөр' : riskLevel === 'medium' ? 'Дунд' : 'Энгийн');
        stSheet.getRange(i + 1, 8).setValue(riskScore);
        stSheet.getRange(i + 1, 9).setValue(now);
        break;
      }
    }
  }

  return { success: true, message: 'Хариулт Google Sheet-д амжилттай хадгалагдлаа.' };
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
