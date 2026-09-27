/**
 * Survey.gs - Responses recording, Autosave, Question importing, Survey status
 */

function saveStudentSurveyAnswers(payload) {
  var auth = verifyToken(payload.token);
  if (!auth.valid) return { success: false, error: 'Нэвтрэх эрхгүй байна' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settings = getSystemSettings();
  if (!settings.surveyOpen && auth.role !== 'admin') {
    return { success: false, error: 'Судалгаа одоогоор хаагдсан байна.' };
  }

  var studentId = payload.studentId;
  var answers = payload.answers || {}; // questionId -> answer
  var isFinalSubmit = Boolean(payload.isFinalSubmit);

  // Check if student already submitted and not allowed to retake
  var studentSheet = ss.getSheetByName('Students');
  var sData = studentSheet.getDataRange().getValues();
  var studentRowIdx = -1;
  var studentRecord = null;

  for (var i = 1; i < sData.length; i++) {
    if (sData[i][0] === studentId) {
      studentRowIdx = i + 1;
      studentRecord = sData[i];
      break;
    }
  }

  if (!studentRecord) {
    return { success: false, error: 'Сурагчийн бүртгэл олдсонгүй.' };
  }

  var alreadySubmitted = Boolean(studentRecord[7]);
  var canRetake = Boolean(studentRecord[9]);

  if (alreadySubmitted && !canRetake && auth.role !== 'admin') {
    return {
      success: false,
      error: 'Та судалгааг өмнө нь амжилттай илгээсэн байна. Дахин бөглөх боломжгүй.'
    };
  }

  var responsesSheet = ss.getSheetByName('Responses');
  var now = new Date().toISOString();
  var schoolName = settings.schoolName || 'Сургууль';
  var academicYear = settings.academicYear || '2025-2026';
  var className = studentRecord[2];
  var studentCode = studentRecord[3];
  var studentName = studentRecord[5];

  // If final submit, clear any prior answers of this student to prevent duplicate rows
  if (isFinalSubmit) {
    var rData = responsesSheet.getDataRange().getValues();
    for (var r = rData.length - 1; r >= 1; r--) {
      if (rData[r][4] === studentCode || rData[r][4] === studentId) {
        responsesSheet.deleteRow(r + 1);
      }
    }

    var questionMap = getQuestionsMap();
    var rowsToAdd = [];

    for (var qId in answers) {
      var ansVal = answers[qId];
      if (ansVal !== undefined && ansVal !== '') {
        var qMeta = questionMap[qId] || { question: qId, section: '' };
        rowsToAdd.push([
          now,
          schoolName,
          academicYear,
          className,
          studentCode,
          studentName,
          qId,
          qMeta.question,
          qMeta.section,
          String(ansVal)
        ]);
      }
    }

    if (rowsToAdd.length > 0) {
      var startRow = responsesSheet.getLastRow() + 1;
      responsesSheet.getRange(startRow, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
    }

    // Mark student as submitted in Students sheet
    studentSheet.getRange(studentRowIdx, 8).setValue(true); // IsSubmitted
    studentSheet.getRange(studentRowIdx, 9).setValue(now); // SubmittedAt
    studentSheet.getRange(studentRowIdx, 10).setValue(false); // CanRetake reset

    logSystemAction('STUDENT', studentName, 'SUBMIT_SURVEY', studentCode + ' судалгааг амжилттай илгээлээ.');
  }

  return {
    success: true,
    message: isFinalSubmit ? 'Судалгаа амжилттай илгээгдлээ!' : 'Хэсэгчилсэн хариулт хадгалагдлаа.',
    submittedAt: now
  };
}

function getStudentSurveyAnswers(studentId, token) {
  var auth = verifyToken(token);
  if (!auth.valid) return { success: false, error: 'Нэвтрэх эрхгүй' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var responsesSheet = ss.getSheetByName('Responses');
  var data = responsesSheet.getDataRange().getValues();

  var answers = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][4] === studentId) {
      answers[data[i][6]] = data[i][9];
    }
  }

  return { success: true, answers: answers };
}

function importQuestionsFromData(questionsList) {
  if (!questionsList || !questionsList.length) {
    return { success: false, error: 'Асуултын өгөгдөл хоосон байна.' };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var qSheet = ss.getSheetByName('Questions');
  qSheet.clearContents();
  qSheet.appendRow(['QuestionID', 'SectionID', 'Section', 'Question', 'Type', 'Required', 'OptionsJSON', 'SourceCol']);

  var rows = questionsList.map(function(q) {
    return [
      q.id,
      q.section_id,
      q.section,
      q.question,
      q.type,
      q.required || false,
      JSON.stringify(q.options || []),
      q.source_column || ''
    ];
  });

  qSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return { success: true, count: rows.length };
}

function getQuestionsMap() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var qSheet = ss.getSheetByName('Questions');
  var map = {};
  if (!qSheet || qSheet.getLastRow() <= 1) return map;

  var data = qSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    map[data[i][0]] = {
      sectionId: data[i][1],
      section: data[i][2],
      question: data[i][3],
      type: data[i][4]
    };
  }
  return map;
}

function setStudentRetake(studentId, allowed, token) {
  var auth = verifyToken(token);
  if (!auth.valid || auth.role !== 'admin') {
    return { success: false, error: 'Зөвхөн админ дахин бөглөх эрх олгох боломжтой.' };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sSheet = ss.getSheetByName('Students');
  var data = sSheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === studentId || data[i][3] === studentId) {
      sSheet.getRange(i + 1, 10).setValue(Boolean(allowed));
      if (allowed) {
        sSheet.getRange(i + 1, 8).setValue(false); // Reset submitted status
      }
      logSystemAction('ADMIN', auth.userId, 'RETAKE_PERMISSION', 'Сурагчид дахин бөглөх эрх: ' + allowed);
      return { success: true, message: 'Дахин бөглөх эрх шинэчлэгдлээ.' };
    }
  }

  return { success: false, error: 'Сурагч олдсонгүй.' };
}
