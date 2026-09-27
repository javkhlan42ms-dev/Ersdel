/**
 * Students.gs - Student Management, Auto Credentials, Bulk Import
 */

function generateRandomStudentPassword() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var pass = '';
  for (var i = 0; i < 6; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function getNextStudentCode(className, currentCount) {
  // Example: Class "7А" -> "7A001"
  var cleanClass = className.replace(/[^0-9a-zA-Z]/g, '');
  if (!cleanClass) cleanClass = 'STU';
  var nextNum = currentCount + 1;
  var numStr = ('000' + nextNum).slice(-3);
  return cleanClass + numStr;
}

function getStudentsByClass(classId, token) {
  var auth = verifyToken(token);
  if (!auth.valid) return { success: false, error: 'Нэвтрэх эрхгүй байна' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Students');
  var data = sheet.getDataRange().getValues();

  var students = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === classId || auth.role === 'admin') {
      students.push({
        id: data[i][0],
        classId: data[i][1],
        className: data[i][2],
        studentCode: data[i][3],
        password: data[i][4],
        fullName: data[i][5],
        gender: data[i][6],
        isSubmitted: Boolean(data[i][7]),
        submittedAt: data[i][8],
        canRetake: Boolean(data[i][9])
      });
    }
  }

  return { success: true, students: students };
}

function addNewStudent(payload) {
  var auth = verifyToken(payload.token);
  if (!auth.valid) return { success: false, error: 'Зөвшөөрөлгүй хандалт' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Students');
  var data = sheet.getDataRange().getValues();

  var classId = payload.classId;
  var className = payload.className;
  var fullName = (payload.fullName || '').trim();
  var gender = payload.gender || '1';

  var existingInClass = 0;
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === classId) existingInClass++;
  }

  var studentId = 'STU_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000);
  var studentCode = payload.studentCode || getNextStudentCode(className, existingInClass);
  var password = payload.password || generateRandomStudentPassword();
  var now = new Date().toISOString();

  sheet.appendRow([
    studentId,
    classId,
    className,
    studentCode,
    password,
    fullName,
    gender,
    false,
    '',
    false,
    now
  ]);

  logSystemAction(auth.role, auth.userId, 'ADD_STUDENT', 'Сурагч нэмэгдлээ: ' + fullName + ' (' + studentCode + ')');

  return {
    success: true,
    student: {
      id: studentId,
      classId: classId,
      className: className,
      studentCode: studentCode,
      password: password,
      fullName: fullName,
      gender: gender,
      isSubmitted: false
    }
  };
}

function bulkImportStudents(payload) {
  var auth = verifyToken(payload.token);
  if (!auth.valid) return { success: false, error: 'Зөвшөөрөлгүй хандалт' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Students');
  var data = sheet.getDataRange().getValues();

  var classId = payload.classId;
  var className = payload.className;
  var studentNames = payload.names || [];

  var existingInClass = 0;
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === classId) existingInClass++;
  }

  var rowsToAdd = [];
  var createdStudents = [];
  var now = new Date().toISOString();

  studentNames.forEach(function(item, idx) {
    var name = typeof item === 'string' ? item.trim() : (item.name || '').trim();
    var gender = (typeof item === 'object' && item.gender) ? item.gender : '1';
    if (!name) return;

    var sId = 'STU_' + (new Date().getTime() + idx);
    var sCode = getNextStudentCode(className, existingInClass + idx);
    var sPass = generateRandomStudentPassword();

    rowsToAdd.push([sId, classId, className, sCode, sPass, name, gender, false, '', false, now]);
    createdStudents.push({
      id: sId,
      classId: classId,
      className: className,
      studentCode: sCode,
      password: sPass,
      fullName: name,
      gender: gender,
      isSubmitted: false
    });
  });

  if (rowsToAdd.length > 0) {
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
  }

  logSystemAction(auth.role, auth.userId, 'BULK_IMPORT', classId + ' ангид ' + rowsToAdd.length + ' сурагч импортлов');

  return { success: true, count: rowsToAdd.length, students: createdStudents };
}
