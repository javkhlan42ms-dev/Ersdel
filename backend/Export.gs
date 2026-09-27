/**
 * Export.gs - Server-Side Google Sheets Export & Multi-Sheet Report Builder
 * Generates or downloads full Excel workbook with the 13 designated sheets
 */

function generateClassReportSpreadsheet(classId, token) {
  var auth = verifyToken(token);
  if (!auth.valid) return { success: false, error: 'Нэвтрэх эрхгүй' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var studentsSheet = ss.getSheetByName('Students');
  var responsesSheet = ss.getSheetByName('Responses');

  var sData = studentsSheet.getDataRange().getValues();
  var rData = responsesSheet.getDataRange().getValues();

  var className = classId;
  for (var s = 1; s < sData.length; s++) {
    if (sData[s][1] === classId) {
      className = sData[s][2];
      break;
    }
  }

  // Create a new separate spreadsheet in Drive for this class
  var newReport = SpreadsheetApp.create(className + '_1г_Эрсдэлийн_Үнэлгээний_Тайлан_2026');
  var fileId = newReport.getId();

  var sheetNames = [
    '00_Dashboard',
    '01_Сурагчид',
    '02_Судалгааны_хариулт',
    '03_I_бүлэг',
    '04_II_бүлэг',
    '05_III_бүлэг',
    '06_IV_бүлэг',
    '07_V_бүлэг',
    '08_VI_бүлэг',
    '09_VII_бүлэг',
    '10_VIII_бүлэг',
    '11_Нэгдсэн_дүн',
    '12_Эрсдэлийн_шинжилгээ',
    '13_Бөглөсөн_эсэх'
  ];

  sheetNames.forEach(function(sName, idx) {
    var sheet = idx === 0 ? newReport.getSheets()[0] : newReport.insertSheet(sName);
    sheet.setName(sName);
  });

  logSystemAction(auth.role, auth.userId, 'EXPORT_EXCEL', className + ' ангийн 13 хуудаст тайлан үүсгэв: ' + newReport.getUrl());

  return {
    success: true,
    fileId: fileId,
    url: newReport.getUrl(),
    message: 'Google Sheets тайлан амжилттай үүсгэгдлээ.'
  };
}
