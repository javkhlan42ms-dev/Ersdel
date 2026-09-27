/**
 * Results.gs - Risk calculations, Aggregations, Summary & RiskAnalysis update
 */

function getClassResultsAndRisk(classId, token) {
  var auth = verifyToken(token);
  if (!auth.valid) return { success: false, error: 'Нэвтрэх эрхгүй' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var studentsSheet = ss.getSheetByName('Students');
  var responsesSheet = ss.getSheetByName('Responses');

  var sData = studentsSheet.getDataRange().getValues();
  var rData = responsesSheet.getDataRange().getValues();

  // Filter students
  var studentsInClass = [];
  for (var i = 1; i < sData.length; i++) {
    if (sData[i][1] === classId || auth.role === 'admin') {
      studentsInClass.push({
        id: sData[i][0],
        classId: sData[i][1],
        className: sData[i][2],
        studentCode: sData[i][3],
        fullName: sData[i][5],
        gender: sData[i][6],
        isSubmitted: Boolean(sData[i][7]),
        submittedAt: sData[i][8]
      });
    }
  }

  // Group responses by student code
  var answersByStudent = {};
  for (var j = 1; j < rData.length; j++) {
    var sCode = rData[j][4];
    var qId = rData[j][6];
    var ans = rData[j][9];
    if (!answersByStudent[sCode]) answersByStudent[sCode] = {};
    answersByStudent[sCode][qId] = ans;
  }

  var total = studentsInClass.length;
  var submitted = 0;
  var lowRisk = 0;
  var medRisk = 0;
  var highRisk = 0;

  var studentEvaluations = [];

  studentsInClass.forEach(function(st) {
    if (st.isSubmitted) {
      submitted++;
      var answers = answersByStudent[st.studentCode] || {};
      var evalResult = calculateStudentRiskGas(st, answers);

      if (evalResult.level === 'high') highRisk++;
      else if (evalResult.level === 'medium') medRisk++;
      else lowRisk++;

      studentEvaluations.push({
        student: st,
        evaluation: evalResult
      });
    } else {
      studentEvaluations.push({
        student: st,
        evaluation: {
          studentCode: st.studentCode,
          fullName: st.fullName,
          totalScore: 0,
          level: 'unsubmitted',
          flags: []
        }
      });
    }
  });

  var pending = total - submitted;
  var rate = total > 0 ? Math.round((submitted / total) * 100) : 0;

  // Update Summary Sheet
  updateSummarySheet(classId, total, submitted, pending, rate, lowRisk, medRisk, highRisk);

  return {
    success: true,
    stats: {
      total: total,
      submitted: submitted,
      pending: pending,
      completionRate: rate,
      riskLevels: {
        low: lowRisk,
        medium: medRisk,
        high: highRisk
      }
    },
    evaluations: studentEvaluations
  };
}

function calculateStudentRiskGas(student, answers) {
  var score = 0;
  var flags = [];

  if (answers['Q035'] === '1') { score += 5; flags.push('Бие махбодийн хүчирхийлэл'); }
  if (answers['Q036'] === '1') { score += 6; flags.push('Бэлгийн хүчирхийлэл'); }
  if (answers['Q037'] === '1') { score += 4; flags.push('Сэтгэл санааны дарамт'); }
  if (answers['Q038'] === '1') { score += 4; flags.push('Үл хайхрах байдал'); }
  if (answers['Q116'] === '1' || answers['Q117'] === '1') { score += 4; flags.push('Сургууль/дотуур байрны гадуурхалт'); }
  if (answers['Q118'] === '1') { score += 4; flags.push('Багш, ажилтны дарамт'); }
  if (answers['Q123'] === '1') { score += 5; flags.push('Гэр бүлийн хүчирхийлэл'); }
  if (answers['Q140'] === '1') { score += 4; flags.push('Архи хэрэглээ'); }
  if (answers['Q141'] === '1') { score += 6; flags.push('Сэтгэцэд нөлөөлөх бодис'); }
  if (answers['Q092'] && answers['Q092'] !== '8') { score += 3; flags.push('Хөдөлмөр эрхлэлт'); }

  var level = 'low';
  if (score >= 8 || answers['Q035'] === '1' || answers['Q036'] === '1' || answers['Q123'] === '1' || answers['Q141'] === '1') {
    level = 'high';
  } else if (score >= 3) {
    level = 'medium';
  }

  return {
    studentCode: student.studentCode,
    fullName: student.fullName,
    totalScore: score,
    level: level,
    flags: flags
  };
}

function updateSummarySheet(classId, total, submitted, pending, rate, low, med, high) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Summary');
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  var found = false;
  var now = new Date().toISOString();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === classId) {
      sheet.getRange(i + 1, 3, 1, 8).setValues([[total, submitted, pending, rate + '%', low, med, high, now]]);
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow([classId, classId, total, submitted, pending, rate + '%', low, med, high, now]);
  }
}
