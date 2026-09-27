/**
 * Auth.gs - Authentication & Session Token Handler
 */

function handleAuthLogin(payload) {
  var role = payload.role; // 'admin' | 'teacher' | 'student'
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (role === 'admin') {
    var adminSheet = ss.getSheetByName('Admins');
    var data = adminSheet.getDataRange().getValues();
    // Headers: AdminID, Username, PasswordHash, FullName, Role, CreatedAt
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === payload.username && data[i][2] === payload.password) {
        var token = generateSecureToken('admin', data[i][0]);
        logSystemAction('ADMIN', data[i][3], 'LOGIN', 'Админ амжилттай нэвтэрлээ');
        return {
          success: true,
          role: 'admin',
          user: {
            id: data[i][0],
            username: data[i][1],
            fullName: data[i][3]
          },
          token: token
        };
      }
    }
    return { success: false, error: 'Админы нэвтрэх нэр эсвэл нууц үг буруу байна.' };
  }

  if (role === 'teacher') {
    // Teacher logs in with TeacherCode (e.g. TEACH-7A)
    var teacherSheet = ss.getSheetByName('Teachers');
    var tData = teacherSheet.getDataRange().getValues();
    // Headers: TeacherID, TeacherCode, FullName, ClassID, ClassName, Phone, CreatedAt
    var cleanCode = (payload.teacherCode || '').trim();
    for (var j = 1; j < tData.length; j++) {
      if (tData[j][1] === cleanCode) {
        var tToken = generateSecureToken('teacher', tData[j][0], tData[j][3]);
        logSystemAction('TEACHER', tData[j][2], 'LOGIN', 'Багш кодоор нэвтэрлээ: ' + cleanCode);
        return {
          success: true,
          role: 'teacher',
          user: {
            id: tData[j][0],
            teacherCode: tData[j][1],
            fullName: tData[j][2],
            classId: tData[j][3],
            className: tData[j][4]
          },
          token: tToken
        };
      }
    }
    return { success: false, error: 'Ангийн багшийн код олдсонгүй.' };
  }

  if (role === 'student') {
    // Student logs in with StudentCode (e.g. 7A001) and Password (e.g. A8K29P)
    var studentSheet = ss.getSheetByName('Students');
    var sData = studentSheet.getDataRange().getValues();
    // Headers: StudentID, ClassID, ClassName, StudentCode, Password, FullName, Gender, IsSubmitted, SubmittedAt, CanRetake
    var sCode = (payload.studentCode || '').trim();
    var sPass = (payload.password || '').trim();

    for (var k = 1; k < sData.length; k++) {
      if (sData[k][3] === sCode && sData[k][4] === sPass) {
        var sToken = generateSecureToken('student', sData[k][0], sData[k][1]);
        logSystemAction('STUDENT', sData[k][5], 'LOGIN', 'Сурагч нэвтэрлээ: ' + sCode);
        return {
          success: true,
          role: 'student',
          user: {
            id: sData[k][0],
            classId: sData[k][1],
            className: sData[k][2],
            studentCode: sData[k][3],
            fullName: sData[k][5],
            gender: sData[k][6],
            isSubmitted: Boolean(sData[k][7]),
            submittedAt: sData[k][8],
            canRetake: Boolean(sData[k][9])
          },
          token: sToken
        };
      }
    }
    return { success: false, error: 'Сурагчийн код эсвэл нууц үг буруу байна.' };
  }

  return { success: false, error: 'Тодорхойгүй эрх' };
}
