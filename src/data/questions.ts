import { Section, Question } from '../types';

export const SECTIONS: Section[] = [
  { id: 1, title: 'I. Ерөнхий мэдээлэл' },
  { id: 2, title: 'II. Эцэг эх, асран хамгаалагчийн дэлгэрэнгүй мэдээлэл' },
  { id: 3, title: 'III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд' },
  { id: 4, title: 'IV. Нийгмийн амьдралд оролцох эрхийн хүрээнд' },
  { id: 5, title: 'V. Сурч боловсрох эрхийн хүрээнд' },
  { id: 6, title: 'VI. Хичээлээс гадуур хөдөлмөр эрхлэлт' },
  { id: 7, title: 'VII. Нийгмийн болон сургуулийн орчны эрсдэл' },
  { id: 8, title: 'VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл' }
];

export interface SubSectionDefinition {
  id: string;
  order: number;
  title: string;
  color_name: string;
  theme: {
    header: string;
    background: string;
    accent: string;
    border: string;
    badge: string;
    badge_text: string;
  };
  responsive_grid: string;
  questions_count: number;
}

export const SECTION_V_SUBSECTIONS: SubSectionDefinition[] = [
  {
    id: "sub_5_1",
    order: 1,
    title: "Суралцах таатай орчин бүрдүүлэлт",
    color_name: "Цэнхэр / Blue",
    theme: {
      header: "#2563EB",
      background: "#EFF6FF",
      accent: "#3B82F6",
      border: "#BFDBFE",
      badge: "#DBEAFE",
      badge_text: "#1E40AF"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    questions_count: 7
  },
  {
    id: "sub_5_2",
    order: 2,
    title: "Суралцагчийн хөгжил оролцооны ерөнхий байдал",
    color_name: "Нил ягаан / Purple",
    theme: {
      header: "#7C3AED",
      background: "#F5F3FF",
      accent: "#8B5CF6",
      border: "#DDD6FE",
      badge: "#EDE9FE",
      badge_text: "#5B21B6"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    questions_count: 6
  },
  {
    id: "sub_5_3",
    order: 3,
    title: "Сонгонд хамрагдсан байдал",
    color_name: "Ногоон / Green",
    theme: {
      header: "#059669",
      background: "#ECFDF5",
      accent: "#10B981",
      border: "#A7F3D0",
      badge: "#D1FAE5",
      badge_text: "#065F46"
    },
    responsive_grid: "grid-cols-1",
    questions_count: 1
  },
  {
    id: "sub_5_4",
    order: 4,
    title: "Авьяас чадвараа хөгжүүлэх сонирхол",
    color_name: "Улбар шар / Orange",
    theme: {
      header: "#D97706",
      background: "#FFFBEB",
      accent: "#F59E0B",
      border: "#FDE68A",
      badge: "#FEF3C7",
      badge_text: "#92400E"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    questions_count: 7
  }
];

export const RAW_QUESTIONS: Question[] = [
  {
    id: "Q001",
    section_id: 1,
    section: "I. Ерөнхий мэдээлэл",
    source_row: 2,
    source_column: 4,
    question: "Хүйс",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Эм" },
      { value: "2", label: "Эр" }
    ]
  },
  {
    id: "Q002",
    section_id: 1,
    section: "I. Ерөнхий мэдээлэл",
    source_row: 2,
    source_column: 6,
    question: "Регистрийн дугаар",
    type: "registration_number",
    required: false,
    options: []
  },
  {
    id: "Q003",
    section_id: 1,
    section: "I. Ерөнхий мэдээлэл",
    source_row: 2,
    source_column: 7,
    question: "Нас",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "6" },
      { value: "2", label: "7" },
      { value: "3", label: "8" },
      { value: "4", label: "9" },
      { value: "5", label: "10" },
      { value: "6", label: "11" },
      { value: "7", label: "12" },
      { value: "8", label: "13" },
      { value: "9", label: "14" },
      { value: "10", label: "15" },
      { value: "11", label: "16" },
      { value: "12", label: "17" },
      { value: "13", label: "18" },
      { value: "14", label: "19" }
    ]
  },
  {
    id: "Q004",
    section_id: 1,
    section: "I. Ерөнхий мэдээлэл",
    source_row: 2,
    source_column: 9,
    question: "Үндсэн харьяалал",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Алаг-Эрдэнэ" },
      { value: "2", label: "Арбулаг" },
      { value: "3", label: "Баянзүрх" },
      { value: "4", label: "Бүрэнтогтох" },
      { value: "5", label: "Галт" },
      { value: "6", label: "Жаргал" },
      { value: "7", label: "Их-Уул" },
      { value: "8", label: "Рашаант" },
      { value: "9", label: "Ренчинлхүмбэ" },
      { value: "10", label: "Тариалан" },
      { value: "11", label: "Тосонцэнгэл" },
      { value: "12", label: "Төмөрбулаг" },
      { value: "13", label: "Түнэл" },
      { value: "14", label: "Улаан-Уул" },
      { value: "15", label: "Ханх" },
      { value: "16", label: "Хатгал" },
      { value: "17", label: "Цагааннуур" },
      { value: "18", label: "Цагаан-Уул" },
      { value: "19", label: "Цагаан-үүр" },
      { value: "20", label: "Цэцэрлэг" },
      { value: "21", label: "Чандмань-Өндөр" },
      { value: "22", label: "Шинэ-Идэр" },
      { value: "23", label: "Эрдэнэбулган" },
      { value: "24", label: "Мөрөн" },
      { value: "25", label: "Улаанбаатар" },
      { value: "26", label: "Дархан" },
      { value: "27", label: "Эрдэнэт" },
      { value: "28", label: "Сэлэнгэ" },
      { value: "29", label: "Булган" },
      { value: "30", label: "Архангай" },
      { value: "31", label: "Сүхбаатар" }
    ]
  },
  {
    id: "Q005",
    section_id: 1,
    section: "I. Ерөнхий мэдээлэл",
    source_row: 2,
    source_column: 11,
    question: "Үндсэн харьяаллын дагуух гэрийн хаяг /Жнь: Хөхтолгой,08-01-03/",
    type: "text",
    required: false,
    options: []
  },
  {
    id: "Q006",
    section_id: 1,
    section: "I. Ерөнхий мэдээлэл",
    source_row: 2,
    source_column: 12,
    question: "Сургуульд суралцаж буй гэрийн хаяг",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "1-р баг/хороо" },
      { value: "2", label: "2-р баг/хороо" },
      { value: "3", label: "3-р баг/хороо" },
      { value: "4", label: "4-р баг/хороо" },
      { value: "5", label: "5-р баг/хороо" },
      { value: "6", label: "6-р баг/хороо" },
      { value: "7", label: "7-р баг/хороо" },
      { value: "8", label: "8-р баг/хороо" },
      { value: "9", label: "9-р баг/хороо" },
      { value: "10", label: "10-р баг/хороо" },
      { value: "11", label: "11-р баг/хороо" },
      { value: "12", label: "12-р баг/хороо" },
      { value: "13", label: "13-р баг/хороо" },
      { value: "14", label: "14-р баг/хороо" },
      { value: "15", label: "Өөрийн сумандаа" }
    ]
  },
  {
    id: "Q007",
    section_id: 1,
    section: "I. Ерөнхий мэдээлэл",
    source_row: 2,
    source_column: 14,
    question: "Facebook болон mail хаяг",
    type: "text",
    required: false,
    options: []
  },
  {
    id: "Q008",
    section_id: 1,
    section: "I. Ерөнхий мэдээлэл",
    source_row: 2,
    source_column: 15,
    question: "Ам бүлийн тоо",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "2" },
      { value: "2", label: "3" },
      { value: "3", label: "4" },
      { value: "4", label: "5" },
      { value: "5", label: "6" },
      { value: "6", label: "7-гоос дээш" }
    ]
  },
  {
    id: "Q009",
    section_id: 1,
    section: "I. Ерөнхий мэдээлэл",
    source_row: 2,
    source_column: 17,
    question: "ЕБС-д 3 болон түүнээс дээш хүүхэд нь суралцаж байгаа эсэх",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Тийм"},
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q010",
    section_id: 1,
    section: "I. Ерөнхий мэдээлэл",
    source_row: 2,
    source_column: 19,
    question: "Айлын ганц хүүхэд",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q011",
    section_id: 1,
    section: "I. Ерөнхий мэдээлэл",
    source_row: 2,
    source_column: 21,
    question: "Айлын ууган хүүхэд",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },

  // SECTION II
  {
    id: "Q012",
    section_id: 2,
    section: "II. Эцэг эх, асран хамгаалагчийн дэлгэрэнгүй мэдээлэл",
    source_row: 2,
    source_column: 23,
    question: "Хэнтэйгээ хамт амьдардаг вэ?",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Эцэг эхтэйгээ" },
      { value: "2", label: "Ээжтэйгээ" },
      { value: "3", label: "Аавтайгаа" },
      { value: "4", label: "Хойд ээжтэйгээ" },
      { value: "5", label: "Хойд аавтайгаа" },
      { value: "6", label: "Эмээтэйгээ" },
      { value: "7", label: "Өвөөтэйгээ" },
      { value: "8", label: "Нагац ах, эгчтэйгээ" },
      { value: "9", label: "Авга ах, эгчтэйгээ" },
      { value: "10", label: "Төрсөн ах, эгчтэйгээ" }
    ]
  },
  {
    id: "Q022",
    section_id: 2,
    section: "II. Эцэг эх, асран хамгаалагчийн дэлгэрэнгүй мэдээлэл ",
    source_row: 2,
    source_column: 43,
    question: "Ургийн овог /Киррил үсгээр оруулна уу.",
    type: "text",
    required: false,
    options: []
  },
  {
    id: "Q023",
    section_id: 2,
    section: "II. Эцэг эх, асран хамгаалагчийн дэлгэрэнгүй мэдээлэл",
    source_row: 2,
    source_column: 44,
    question: "Эцгийн нэр /Киррил үсгээр оруулна/",
    type: "text",
    required: false,
    options: []
  },
  {
    id: "Q024",
    section_id: 2,
    section: "II. Эцэг эх, асран хамгаалагчийн дэлгэрэнгүй мэдээлэл",
    source_row: 2,
    source_column: 45,
    question: "Эцгийн боловсрол эзэмшилт",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Дээд" },
      { value: "2", label: "Тусгай дунд" },
      { value: "3", label: "Бүрэн дунд" },
      { value: "4", label: "Бусад" }
    ]
  },
  {
    id: "Q025",
    section_id: 2,
    section: "II. Эцэг эх, асран хамгаалагчийн дэлгэрэнгүй мэдээлэл",
    source_row: 2,
    source_column: 47,
    question: "Эрхэлж буй ажил",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Багш" },
      { value: "2", label: "Оёдолчин" },
      { value: "3", label: "Үсчин гоо сайханч" },
      { value: "4", label: "Малчин" },
      { value: "5", label: "Онцгой" },
      { value: "6", label: "Тогооч" },
      { value: "7", label: "Инженер" },
      { value: "8", label: "Эмч" },
      { value: "9", label: "Сувилагч" },
      { value: "10", label: "Ажилгүй" },
      { value: "11", label: "Эдийн засагч нягтлан" },
      { value: "12", label: "Мужаан" },
      { value: "13", label: "Хувиараа" },
      { value: "14", label: "Татварт" },
      { value: "15", label: "Хилийн цэрэг" },
      { value: "16", label: "Үйлчилгээний ажилтан" },
      { value: "17", label: "Цагдаа шүүх прокурор" },
      { value: "18", label: "Хот тохижолт" },
      { value: "19", label: "ХАА мэргэжилтэн" },
      { value: "20", label: "Дулааны цахилгаан станц" },
      { value: "21", label: "Гадаадад ажилладаг" },
      { value: "22", label: "Улирлын чанартай ажил эрхэлдэг" },
      { value: "23", label: "Шатахуун түгээх станц" },
      { value: "24", label: "Нисэх" },
      { value: "25", label: "Харуул хамгаалалт" },
      { value: "26", label: "Эрчим хүч" },
      { value: "27", label: "Төрийн алба, захиргаа" },
      { value: "28", label: "Бусад" }
    ]
  },
  {
    id: "Q026",
    section_id: 2,
    section: "II. Эцэг эх, асран хамгаалагчийн дэлгэрэнгүй мэдээлэл",
    source_row: 2,
    source_column: 49,
    question: "Facebook болон mail хаяг",
    type: "text",
    required: false,
    options: []
  },
  {
    id: "Q027",
    section_id: 2,
    section: "II. Эцэг эх, асран хамгаалагчийн дэлгэрэнгүй мэдээлэл",
    source_row: 2,
    source_column: 50,
    question: "Эхийн нэр /Киррил үсгээр оруулна/",
    type: "text",
    required: false,
    options: []
  },
  {
    id: "Q028",
    section_id: 2,
    section: "II. Эцэг эх, асран хамгаалагчийн дэлгэрэнгүй мэдээлэл",
    source_row: 2,
    source_column: 51,
    question: "Эхийн боловсрол эзэмшилт",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Дээд" },
      { value: "2", label: "Тусгай дунд" },
      { value: "3", label: "Бүрэн дунд" },
      { value: "4", label: "Бусад" }
    ]
  },
  {
    id: "Q029",
    section_id: 2,
    section: "II. Эцэг эх, асран хамгаалагчийн дэлгэрэнгүй мэдээлэл",
    source_row: 2,
    source_column: 56,
    question: "Сургуульд суралцаж байх үеийн асран хамгаалагч нь хүүхдийн юу нь болох",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Аав ээж" },
      { value: "2", label: "Төрсөн ах эгч" },
      { value: "3", label: "Эмээ өвөө" },
      { value: "4", label: "Нагац ах эгч дүү" },
      { value: "5", label: "Авга ах эгч дүү" },
      { value: "6", label: "Аав ээжийн найз" },
      { value: "7", label: "Дотуур байрын багш" }
    ]
  },
  {
    id: "Q030",
    section_id: 2,
    section: "II. Эцэг эх, асран хамгаалагчийн дэлгэрэнгүй мэдээлэл",
    source_row: 2,
    source_column: 58,
    question: "Өрхийн сарын орлого",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "300,000-с доош" },
      { value: "2", label: "300,000-400,000" },
      { value: "3", label: "400,000-500,000" },
      { value: "4", label: "500,000-600,000" },
      { value: "5", label: "600,000-700,000" },
      { value: "6", label: "700,000-800,000" },
      { value: "7", label: "800,000-900,000" },
      { value: "8", label: "900,000-1,000,000" },
      { value: "9", label: "1,000,000-с дээш" },
      { value: "10", label: "Малын ашиг шимээр" },
      { value: "11", label: "Зөвхөн хүүхдийн мөнгөөр" }
    ]
  },
  {
    id: "Q031",
    section_id: 2,
    section: "II. Эцэг эх, асран хамгаалагчийн дэлгэрэнгүй мэдээлэл",
    source_row: 2,
    source_column: 60,
    question: "Хүүхдийн мөнгөний зарцуулалт",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Хадгаламжинд" },
      { value: "2", label: "Сар бүр өрхийн хэрэглээнд" },
      { value: "3", label: "Хүүхэд өөртөө авч бүрэн зарцуулдаг" }
    ]
  },
  {
    id: "Q032",
    section_id: 2,
    section: "II. Эцэг эх, асран хамгаалагчийн дэлгэрэнгүй мэдээлэл",
    source_row: 2,
    source_column: 62,
    question: "Хагас бүтэн өнчин эсэх",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Хагас өнчин" },
      { value: "2", label: "Бүтэн өнчин" },
      { value: "3", label: "Өнчин биш" }
    ]
  },
  {
    id: "Q033",
    section_id: 2,
    section: "II. Эцэг эх, асран хамгаалагчийн дэлгэрэнгүй мэдээлэл",
    source_row: 2,
    source_column: 63,
    question: "Асран хамгаалагчийн нэр /Киррил үсгээр зөв бичнэ үү./",
    type: "text",
    required: false,
    options: []
  },
  {
    id: "Q034",
    section_id: 2,
    section: "II. Эцэг эх, асран хамгаалагчийн дэлгэрэнгүй мэдээлэл",
    source_row: 2,
    source_column: 64,
    question: "Асран хамгаалагч, эцэг эхтэй харилцах утас (8 оронтой тоо)",
    type: "phone",
    required: false,
    options: []
  },

  // SECTION III
  {
    id: "Q035",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 65,
    question: "Бие махбодийн хүчирхийлэлд өртсөн байж болзошгүй",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q036",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 67,
    question: "Бэлгийн хүчирхийлэлд өртсөн байж болзошгүй",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q037",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 69,
    question: "Сэтгэл санааны хүчирхийлэлд өртсөн байж болзошгүй",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q038",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 71,
    question: "Үл хайхрах хүчирхийлэлд өртсөн байж болзошгүй",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q039",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 73,
    question: "Хүчирхийлэлд өртсөн тохиолдолд анх хэнд хандаж мэдээлсэн бэ?",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Хамтарсан баг" },
      { value: "2", label: "Газар хэсгийн алба хаагч" },
      { value: "3", label: "Цагдаа" },
      { value: "4", label: "Эмч" },
      { value: "5", label: "Багш" },
      { value: "6", label: "Нийгмийн ажилтан" },
      { value: "7", label: "Багийн засаг дарга" },
      { value: "8", label: "Хорооны хэсгийн ахлагч" },
      { value: "9", label: "Гэр бүлийн гишүүн" },
      { value: "10", label: "Төрөл садан" },
      { value: "11", label: "Хөрш" },
      { value: "12", label: "Хүүхэд өөрөө" },
      { value: "13", label: "Найз нөхөд" }
    ]
  },
  {
    id: "Q040",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 75,
    question: "Хүчирхийлэл үйлдэгдсэн орчин",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Гэр бүл" },
      { value: "2", label: "Боловсролын байгууллага" },
      { value: "3", label: "Эрүүл мэндийн байгууллага" },
      { value: "4", label: "Дотуур байр" },
      { value: "5", label: "Төвлөрсөн асрамж халамжийн газарт" },
      { value: "6", label: "Нэг цэгийн үйлчилгээний төвд" },
      { value: "7", label: "Түр хамгаалах байр" },
      { value: "8", label: "Зусланд" },
      { value: "9", label: "Хэвлэл мэдээлэл цахим орчинд" },
      { value: "10", label: "Хөдөө" },
      { value: "11", label: "Амралтын газарт" },
      { value: "12", label: "Үе тэнгийн орчин" }
    ]
  },
  {
    id: "Q041",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 77,
    question: "Хүчирхийлэл үйлдсэн этгээд",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Төрсөн эцэг эх" },
      { value: "2", label: "Хойд эцэг эх" },
      { value: "3", label: "Өвөө эмээ" },
      { value: "4", label: "Төрсөн ах эгч дүү" },
      { value: "5", label: "Хүргэн ах бэр эгч" },
      { value: "6", label: "Хойд ах эгч" },
      { value: "7", label: "Авга ах эгч" },
      { value: "8", label: "Нагац ах эгч" },
      { value: "9", label: "Үл таних хүн" },
      { value: "10", label: "Аав ээжийн найз" },
      { value: "11", label: "Ах эгчийн найз" },
      { value: "12", label: "Хөрш" },
      { value: "13", label: "Багш" },
      { value: "14", label: "Үе тэнгийн найз" }
    ]
  },
  {
    id: "Q042",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 79,
    question: "Хүүхэд хамгааллын үйлчилгээнд хамрагдсан эсэх",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q043",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 81,
    question: "Хөгжлийн бэрхшээлтэй эсэх",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q044",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 83,
    question: "Бэрхшээлийн хэлбэр",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "ADHD" },
      { value: "2", label: "Аутизм" },
      { value: "3", label: "Даун" },
      { value: "4", label: "Оюун ухаан" },
      { value: "5", label: "Сонсгол" },
      { value: "6", label: "Сурахуйн бэрхшээл" },
      { value: "7", label: "Хараа" },
      { value: "8", label: "Хэл яриа" },
      { value: "9", label: "Саажилт" },
      { value: "10", label: "Хөдөлгөөний эмгэг" },
      { value: "11", label: "Уналт таталт" }
    ]
  },
  {
    id: "Q045",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 85,
    question: "ХБХ бол нийгмийн халамжинд хамрагддаг эсэх",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q046",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 87,
    question: "Хүүхдийн амьдардаг орчин",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Монгол гэр" },
      { value: "2", label: "Байшин" },
      { value: "3", label: "Орон сууц" },
      { value: "4", label: "Дотуур байр" }
    ]
  },
  {
    id: "Q047",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 89,
    question: "Хүүхдийн амьдардаг орчин нь тогтвортой эсэх",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Өөрийн гэрт" },
      { value: "2", label: "Хөлсний гэр" },
      { value: "3", label: "Хөлсний байшин" },
      { value: "4", label: "Хөлсний хашаа" },
      { value: "5", label: "Айлаар амьдардаг" },
      { value: "6", label: "Дотуур байр" }
    ]
  },
  {
    id: "Q048",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 91,
    question: "Биеийн өвчлөл хэр байдаг вэ, өвчлөх магадлал ихтэй",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q049",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 93,
    question: "Тийм бол өвчлөлийн шалтгаан өвчлөлөөс дэлгэрэнгүй",
    type: "text",
    required: false,
    options: []
  },
  {
    id: "Q050",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 94,
    question: "Биеийн аль нэг хэсэгт гэмтэл бэртэл авсан эсэх",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Тархины хагалгаанд орсон" },
      { value: "2", label: "Хөлний бэртэл гэмтэл" },
      { value: "3", label: "Гарын гэмтэл бэртэл" },
      { value: "4", label: "Цээжний бэртэл гэмтэл" },
      { value: "5", label: "Чихний хагалгаанд орсон" },
      { value: "6", label: "Нурууны хагалгаанд орсон" },
      { value: "7", label: "Гэмтэл бэртэл аваагүй" }
    ]
  },
  {
    id: "Q051",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 96,
    question: "Гадуурхагддаг эсэх",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Ангидаа" },
      { value: "2", label: "Найз нөхдөд" },
      { value: "3", label: "Гэр бүлд" },
      { value: "4", label: "Аливаа ажилд хойш суудаг" },
      { value: "5", label: "Зожиг" },
      { value: "6", label: "Гадуурхагддаггүй" }
    ]
  },
  {
    id: "Q052",
    section_id: 3,
    section: "III. Хүүхдийн эрүүл мэнд, амьдрах эрхийн хүрээнд",
    source_row: 2,
    source_column: 98,
    question: "Өрхийн эмнэлэг",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Далай элбэрэл" },
      { value: "2", label: "Гурван гал" },
      { value: "3", label: "Энх-Үйлс" },
      { value: "4", label: "Дэлгэрмөрөн" },
      { value: "5", label: "Энэрэл" },
      { value: "6", label: "Сумын эмнэлэг" }
    ]
  },

  // SECTION IV
  {
    id: "Q053",
    section_id: 4,
    section: "IV. Нийгмийн амьдралд оролцох эрхийн хүрээнд",
    source_row: 2,
    source_column: 100,
    question: "Нийгмийн идэвх оролцооны төвшин",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Сайн" },
      { value: "2", label: "Дунд" },
      { value: "3", label: "Муу" }
    ]
  },
  {
    id: "Q054",
    section_id: 4,
    section: "IV. Нийгмийн амьдралд оролцох эрхийн хүрээнд",
    source_row: 2,
    source_column: 102,
    question: "Хүүхдийн оролцооны байгууллагын нэр",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Аймгийн хүүхдийн зөвлөл" },
      { value: "2", label: "Сумын хүүхдийн зөвлөл" },
      { value: "3", label: "Сургуулийн хүүхдийн зөвлөл" },
      { value: "4", label: "Өсвөрийн цагдаа" },
      { value: "5", label: "Өсвөрийн аврагч" },
      { value: "6", label: "Өсвөрийн хил хамгаалагч" },
      { value: "7", label: "Инпакт" },
      { value: "8", label: "Сэтгэл зүйчийн клуб" },
      { value: "9", label: "Эко" },
      { value: "10", label: "Илтгэл мэтгэлцээн" },
      { value: "11", label: "Ирээдүйн босго" },
      { value: "12", label: "Багш клуб" },
      { value: "13", label: "Номын клуб" },
      { value: "14", label: "Оролцдоггүй" }
    ]
  },
  {
    id: "Q055",
    section_id: 4,
    section: "IV. Нийгмийн амьдралд оролцох эрхийн хүрээнд",
    source_row: 2,
    source_column: 104,
    question: "ДЗОУБ-ын ХИТХ-т хамрагддаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q056",
    section_id: 4,
    section: "IV. Нийгмийн амьдралд оролцох эрхийн хүрээнд",
    source_row: 2,
    source_column: 106,
    question: "Зөнгийн Код заавал бичнэ",
    type: "text",
    required: false,
    options: []
  },
  {
    id: "Q057",
    section_id: 4,
    section: "IV. Нийгмийн амьдралд оролцох эрхийн хүрээнд",
    source_row: 2,
    source_column: 107,
    question: "Хүүхдийн дунд зохион байгуулагдсан уралдаан тэмцээнд оролцсон байдал",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Спорт" },
      { value: "2", label: "Урлаг" },
      { value: "3", label: "Сургалт зөвлөгөөн" },
      { value: "4", label: "Зуслан" },
      { value: "5", label: "Олимпиад" },
      { value: "6", label: "Спорт, урлагт" },
      { value: "7", label: "Олимпиад, урлаг" },
      { value: "8", label: "Олимпиад, спорт" },
      { value: "9", label: "Бүгдэд" },
      { value: "10", label: "Оролцоогүй" }
    ]
  },
  {
    id: "Q058",
    section_id: 4,
    section: "IV. Нийгмийн амьдралд оролцох эрхийн хүрээнд",
    source_row: 2,
    source_column: 109,
    question: "Аливаа үйл ажиллагаанд хүүхдээ дэмжин оролцуулдаг эцэг эх, асран хамгаалагч",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q059",
    section_id: 4,
    section: "IV. Нийгмийн амьдралд оролцох эрхийн хүрээнд",
    source_row: 2,
    source_column: 111,
    question: "Эцэг эх нь сургуулийн ажилд оролцох төвшин",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Сайн" },
      { value: "2", label: "Дунд" },
      { value: "3", label: "Муу" }
    ]
  },

  // SECTION V: СУРЧ БОЛОВСРОХ ЭРХИЙН ХҮРЭЭНД (4 дэд бүлэг, нийт 21 асуулт)
  // Дэд бүлэг 1: Суралцах таатай орчин бүрдүүлэлт (Цэнхэр / Blue) - 7 асуулт
  {
    id: "Q064",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Суралцах таатай орчин бүрдүүлэлт",
    sub_section_id: "sub_5_1",
    sub_section_color: {
      header: "#2563EB",
      background: "#EFF6FF",
      accent: "#3B82F6",
      border: "#BFDBFE",
      badge: "#DBEAFE",
      badge_text: "#1E40AF"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 113,
    question: "Өрх толгойлон амьдардаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q065",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Суралцах таатай орчин бүрдүүлэлт",
    sub_section_id: "sub_5_1",
    sub_section_color: {
      header: "#2563EB",
      background: "#EFF6FF",
      accent: "#3B82F6",
      border: "#BFDBFE",
      badge: "#DBEAFE",
      badge_text: "#1E40AF"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 115,
    question: "Дотуур байранд амьдардаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q066",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Суралцах таатай орчин бүрдүүлэлт",
    sub_section_id: "sub_5_1",
    sub_section_color: {
      header: "#2563EB",
      background: "#EFF6FF",
      accent: "#3B82F6",
      border: "#BFDBFE",
      badge: "#DBEAFE",
      badge_text: "#1E40AF"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 117,
    question: "Айлд амьдардаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q067",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Суралцах таатай орчин бүрдүүлэлт",
    sub_section_id: "sub_5_1",
    sub_section_color: {
      header: "#2563EB",
      background: "#EFF6FF",
      accent: "#3B82F6",
      border: "#BFDBFE",
      badge: "#DBEAFE",
      badge_text: "#1E40AF"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 119,
    question: "Гэр бүлийн орчин таатай эсэх",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q068",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Суралцах таатай орчин бүрдүүлэлт",
    sub_section_id: "sub_5_1",
    sub_section_color: {
      header: "#2563EB",
      background: "#EFF6FF",
      accent: "#3B82F6",
      border: "#BFDBFE",
      badge: "#DBEAFE",
      badge_text: "#1E40AF"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 121,
    question: "Гэрээс сургууль хүртлэх зай /км/",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "0.5 - 1 км" },
      { value: "2", label: "1.5 - 2 км" },
      { value: "3", label: "2.5 - 3 км" },
      { value: "4", label: "3.5 - 4 км" },
      { value: "5", label: "4.5 - 5 км" },
      { value: "6", label: "5 км-ээс дээш" },
      { value: "7", label: "Зам даваа, гол усаар явдаг" }
    ]
  },
  {
    id: "Q069",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Суралцах таатай орчин бүрдүүлэлт",
    sub_section_id: "sub_5_1",
    sub_section_color: {
      header: "#2563EB",
      background: "#EFF6FF",
      accent: "#3B82F6",
      border: "#BFDBFE",
      badge: "#DBEAFE",
      badge_text: "#1E40AF"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 123,
    question: "Тавиул болон өрх толгойлдог бол улирлын амралтаар хэн ирж авдаг, хэнтэй явдаг",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Аав ээж" },
      { value: "2", label: "Ах эгч" },
      { value: "3", label: "Эмээ өвөө" },
      { value: "4", label: "Аав ээжийн дүү" },
      { value: "5", label: "Аав ээжийн ах эгч" },
      { value: "6", label: "Аав ээжийн найз" },
      { value: "7", label: "Нийтийн тээврийн унаагаар өөрөө явдаг" }
    ]
  },
  {
    id: "Q070",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Суралцах таатай орчин бүрдүүлэлт",
    sub_section_id: "sub_5_1",
    sub_section_color: {
      header: "#2563EB",
      background: "#EFF6FF",
      accent: "#3B82F6",
      border: "#BFDBFE",
      badge: "#DBEAFE",
      badge_text: "#1E40AF"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 125,
    question: "Гэр бүлийн тогтвортой байдал",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Аав ээжтэйгээ хамт" },
      { value: "2", label: "Салсан" },
      { value: "4", label: "Аав тусдаа амьдардаг" },
      { value: "5", label: "Ээж тусдаа амьдардаг" }
    ]
  },

  // Дэд бүлэг 2: Суралцагчийн хөгжил оролцооны ерөнхий байдал (Нил ягаан / Purple) - 6 асуулт
  {
    id: "Q071",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Суралцагчийн хөгжил оролцооны ерөнхий байдал",
    sub_section_id: "sub_5_2",
    sub_section_color: {
      header: "#7C3AED",
      background: "#F5F3FF",
      accent: "#8B5CF6",
      border: "#DDD6FE",
      badge: "#EDE9FE",
      badge_text: "#5B21B6"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 127,
    question: "Сурах идэвх оролцооны төвшин",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Сайн" },
      { value: "2", label: "Дунд" },
      { value: "3", label: "Муу" }
    ]
  },
  {
    id: "Q072",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Суралцагчийн хөгжил оролцооны ерөнхий байдал",
    sub_section_id: "sub_5_2",
    sub_section_color: {
      header: "#7C3AED",
      background: "#F5F3FF",
      accent: "#8B5CF6",
      border: "#DDD6FE",
      badge: "#EDE9FE",
      badge_text: "#5B21B6"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 129,
    question: "Тухайн хичээлийн жилд амжилт гаргасан",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Спорт" },
      { value: "2", label: "Урлаг" },
      { value: "3", label: "Олимпиад" },
      { value: "4", label: "Амжилт гаргаагүй" }
    ]
  },
  {
    id: "Q073",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Суралцагчийн хөгжил оролцооны ерөнхий байдал",
    sub_section_id: "sub_5_2",
    sub_section_color: {
      header: "#7C3AED",
      background: "#F5F3FF",
      accent: "#8B5CF6",
      border: "#DDD6FE",
      badge: "#EDE9FE",
      badge_text: "#5B21B6"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 131,
    question: "Тухайн хичээлийн жилд өөр сургуулиас шилжиж ирсэн эсэх",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q074",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Суралцагчийн хөгжил оролцооны ерөнхий байдал",
    sub_section_id: "sub_5_2",
    sub_section_color: {
      header: "#7C3AED",
      background: "#F5F3FF",
      accent: "#8B5CF6",
      border: "#DDD6FE",
      badge: "#EDE9FE",
      badge_text: "#5B21B6"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 133,
    question: "Тухайн хичээлийн жилд ямар нэгэн дугуйлан, секцэнд хамрагдсан эсэх",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q075",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Суралцагчийн хөгжил оролцооны ерөнхий байдал",
    sub_section_id: "sub_5_2",
    sub_section_color: {
      header: "#7C3AED",
      background: "#F5F3FF",
      accent: "#8B5CF6",
      border: "#DDD6FE",
      badge: "#EDE9FE",
      badge_text: "#5B21B6"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 135,
    question: "Сурагчийн дүрэмт хувцастай эсэх",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Бүрэн хувцастай" },
      { value: "2", label: "Цамц өмдтэй" },
      { value: "3", label: "Зөвхөн цамцтай" },
      { value: "4", label: "Дүрэмт хувцасгүй" }
    ]
  },
  {
    id: "Q076",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Суралцагчийн хөгжил оролцооны ерөнхий байдал",
    sub_section_id: "sub_5_2",
    sub_section_color: {
      header: "#7C3AED",
      background: "#F5F3FF",
      accent: "#8B5CF6",
      border: "#DDD6FE",
      badge: "#EDE9FE",
      badge_text: "#5B21B6"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 137,
    question: "Хичээлийн хэрэглэгдэхүүнтэй эсэх",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Бүрэн хэрэглэгдэхүүнтэй" },
      { value: "2", label: "Номтой" },
      { value: "3", label: "Номгүй" },
      { value: "4", label: "Хэрэглэгдэхүүн дутуу" },
      { value: "5", label: "Байхгүй" }
    ]
  },

  // Дэд бүлэг 3: Сонгонд хамрагдсан байдал (Ногоон / Green) - 1 асуулт
  {
    id: "Q077",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Сонгонд хамрагдсан байдал",
    sub_section_id: "sub_5_3",
    sub_section_color: {
      header: "#059669",
      background: "#ECFDF5",
      accent: "#10B981",
      border: "#A7F3D0",
      badge: "#D1FAE5",
      badge_text: "#065F46"
    },
    responsive_grid: "grid-cols-1",
    source_row: 3,
    source_column: 139,
    question: "Сонгонд хамрагдсан байдал",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Монгол хэл, уран зохиол" },
      { value: "2", label: "Математик" },
      { value: "3", label: "Гадаад хэл" },
      { value: "4", label: "Физик" },
      { value: "5", label: "Хими" },
      { value: "6", label: "Биологи" },
      { value: "7", label: "Түүх, нийгмийн ухаан" },
      { value: "8", label: "Газарзүй" },
      { value: "9", label: "Сонгонд хамрагдаагүй" },
      { value: "10", label: "Бусад хичээл" }
    ]
  },

  // Дэд бүлэг 4: Авьяас чадвараа хөгжүүлэх сонирхол (Улбар шар / Orange) - 7 асуулт
  {
    id: "Q078",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Авьяас чадвараа хөгжүүлэх сонирхол",
    sub_section_id: "sub_5_4",
    sub_section_color: {
      header: "#D97706",
      background: "#FFFBEB",
      accent: "#F59E0B",
      border: "#FDE68A",
      badge: "#FEF3C7",
      badge_text: "#92400E"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 147,
    question: "Урлаг",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Дуу" },
      { value: "2", label: "Бүжиг" },
      { value: "3", label: "Яруу найраг" },
      { value: "4", label: "Уран уншлага" },
      { value: "5", label: "Жүжиг" },
      { value: "6", label: "Хөгжим" },
      { value: "7", label: "Уран нугаралт" },
      { value: "8", label: "Оролцдоггүй" }
    ]
  },
  {
    id: "Q079",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Авьяас чадвараа хөгжүүлэх сонирхол",
    sub_section_id: "sub_5_4",
    sub_section_color: {
      header: "#D97706",
      background: "#FFFBEB",
      accent: "#F59E0B",
      border: "#FDE68A",
      badge: "#FEF3C7",
      badge_text: "#92400E"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 149,
    question: "Спорт",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Сагсан бөмбөг" },
      { value: "2", label: "Гар бөмбөг" },
      { value: "3", label: "Хөл бөмбөг" },
      { value: "4", label: "Теннис" },
      { value: "5", label: "Бөх" },
      { value: "6", label: "Бокс" },
      { value: "7", label: "Дугуйн спорт" },
      { value: "8", label: "Уран сайхны гимнастик" },
      { value: "9", label: "Таеквондо" },
      { value: "10", label: "Хүндийн өргөлт" },
      { value: "11", label: "Буудлага" },
      { value: "12", label: "Гүйлт" },
      { value: "13", label: "Тэшүүр" },
      { value: "14", label: "Бадминтон" },
      { value: "15", label: "Оролцдоггүй" }
    ]
  },
  {
    id: "Q080",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Авьяас чадвараа хөгжүүлэх сонирхол",
    sub_section_id: "sub_5_4",
    sub_section_color: {
      header: "#D97706",
      background: "#FFFBEB",
      accent: "#F59E0B",
      border: "#FDE68A",
      badge: "#FEF3C7",
      badge_text: "#92400E"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 151,
    question: "Оюуны спорт",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "IQ спорт" },
      { value: "2", label: "Шатар" },
      { value: "3", label: "Даам" },
      { value: "4", label: "Соробан сампин" },
      { value: "5", label: "Оюун ухааны академи" },
      { value: "6", label: "Оролцдоггүй" }
    ]
  },
  {
    id: "Q081",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Авьяас чадвараа хөгжүүлэх сонирхол",
    sub_section_id: "sub_5_4",
    sub_section_color: {
      header: "#D97706",
      background: "#FFFBEB",
      accent: "#F59E0B",
      border: "#FDE68A",
      badge: "#FEF3C7",
      badge_text: "#92400E"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 153,
    question: "Хувь хүний хөгжлийн чиглэлээр",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Илтгэл мэтгэлцээн" },
      { value: "2", label: "Бусад манлайлал" },
      { value: "3", label: "Байхгүй" }
    ]
  },
  {
    id: "Q082",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Авьяас чадвараа хөгжүүлэх сонирхол",
    sub_section_id: "sub_5_4",
    sub_section_color: {
      header: "#D97706",
      background: "#FFFBEB",
      accent: "#F59E0B",
      border: "#FDE68A",
      badge: "#FEF3C7",
      badge_text: "#92400E"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 155,
    question: "Амьдрах ухаан",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Уран бичлэг" },
      { value: "2", label: "Сийлбэр" },
      { value: "3", label: "Техник сэтгэлгээ, зохион бүтээх" },
      { value: "4", label: "Нэхмэл" },
      { value: "5", label: "Оёдол" },
      { value: "6", label: "Гар урлал" },
      { value: "7", label: "Байхгүй" }
    ]
  },
  {
    id: "Q083",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Авьяас чадвараа хөгжүүлэх сонирхол",
    sub_section_id: "sub_5_4",
    sub_section_color: {
      header: "#D97706",
      background: "#FFFBEB",
      accent: "#F59E0B",
      border: "#FDE68A",
      badge: "#FEF3C7",
      badge_text: "#92400E"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 157,
    question: "Хөгжлийн дэмжих үйлчилгээ үзүүлсэн байгууллага",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Сургууль" },
      { value: "2", label: "Хүүхдийн ордон" },
      { value: "3", label: "Хөгжлийн төвүүд" },
      { value: "4", label: "Хөгжимт драмын театр" },
      { value: "5", label: "Дотуур байр" },
      { value: "6", label: "Аваагүй" }
    ]
  },
  {
    id: "Q084",
    section_id: 5,
    section: "V. Сурч боловсрох эрхийн хүрээнд",
    sub_section: "Авьяас чадвараа хөгжүүлэх сонирхол",
    sub_section_id: "sub_5_4",
    sub_section_color: {
      header: "#D97706",
      background: "#FFFBEB",
      accent: "#F59E0B",
      border: "#FDE68A",
      badge: "#FEF3C7",
      badge_text: "#92400E"
    },
    responsive_grid: "grid-cols-1 md:grid-cols-2",
    source_row: 3,
    source_column: 159,
    question: "Төлбөртэй сургалтанд хамрагддаг эсэх",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },

  // SECTION VI
  {
    id: "Q092",
    section_id: 6,
    section: "VI. Хичээлээс гадуур хөдөлмөр эрхлэлт",
    source_row: 2,
    source_column: 161,
    question: "Хөдөлмөр эрхлэлт",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Барилгын ажил хийдэг" },
      { value: "2", label: "Айлын мал хариулдаг" },
      { value: "3", label: "Амралтын газар" },
      { value: "4", label: "Цайны газар" },
      { value: "5", label: "Ресторан" },
      { value: "6", label: "Машин угаалга" },
      { value: "7", label: "Уяач" },
      { value: "8", label: "Хөдөлмөр эрхэлдэггүй" }
    ]
  },
  {
    id: "Q093",
    section_id: 6,
    section: "VI. Хичээлээс гадуур хөдөлмөр эрхлэлт",
    source_row: 2,
    source_column: 163,
    question: "Хурдан морь унадаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q094",
    section_id: 6,
    section: "VI. Хичээлээс гадуур хөдөлмөр эрхлэлт",
    source_row: 2,
    source_column: 165,
    question: "Хурдан морь унаж уралдсан",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "1 жил" },
      { value: "2", label: "2 жил" },
      { value: "3", label: "3 жил" },
      { value: "4", label: "4 жил" },
      { value: "5", label: "5 жил" },
      { value: "6", label: "6 жил" },
      { value: "7", label: "7 жил" },
      { value: "8", label: "8 жил" }
    ]
  },
  {
    id: "Q095",
    section_id: 6,
    section: "VI. Хичээлээс гадуур хөдөлмөр эрхлэлт",
    source_row: 2,
    source_column: 167,
    question: "2025 онд хэдэн уралдаанд оролцсон",
    type: "select",
    required: false,
    options: [
      { value: "0", label: "Оролцоогүй" },
      { value: "1", label: "1 уралдаан" },
      { value: "2", label: "2 уралдаан" },
      { value: "3", label: "3 уралдаан" },
      { value: "4", label: "4 уралдаан" },
      { value: "5", label: "5 уралдаан" },
      { value: "6", label: "6 уралдаан" },
      { value: "7", label: "7 уралдаан" },
      { value: "8", label: "8-аас дээш" }
    ]
  },
  {
    id: "Q096",
    section_id: 6,
    section: "VI. Хичээлээс гадуур хөдөлмөр эрхлэлт",
    source_row: 2,
    source_column: 169,
    question: "Ямар насны морь унасан",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Даага" },
      { value: "2", label: "Шүдлэн" },
      { value: "3", label: "Хязаалан" },
      { value: "4", label: "Соёолон" },
      { value: "5", label: "Их нас" },
      { value: "6", label: "Азарга" }
    ]
  },
  {
    id: "Q097",
    section_id: 6,
    section: "VI. Хичээлээс гадуур хөдөлмөр эрхлэлт",
    source_row: 2,
    source_column: 171,
    question: "Даатгалд хамрагдсан эсэх",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q098",
    section_id: 6,
    section: "VI. Хичээлээс гадуур хөдөлмөр эрхлэлт",
    source_row: 2,
    source_column: 173,
    question: "Даатгалын хураамжийн мөнгөн дүн",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "1 сая" },
      { value: "2", label: "2 сая" },
      { value: "3", label: "Хамрагдаагүй" }
    ]
  },
  {
    id: "Q099",
    section_id: 6,
    section: "VI. Хичээлээс гадуур хөдөлмөр эрхлэлт",
    source_row: 2,
    source_column: 175,
    question: "Унаж бэртэж байсан эсэх",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q100",
    section_id: 6,
    section: "VI. Хичээлээс гадуур хөдөлмөр эрхлэлт",
    source_row: 2,
    source_column: 177,
    question: "Бэртэл гэмтэл тодорхой бичих",
    type: "text",
    required: false,
    options: []
  },
  {
    id: "Q101",
    section_id: 6,
    section: "VI. Хичээлээс гадуур хөдөлмөр эрхлэлт",
    source_row: 2,
    source_column: 178,
    question: "Хурдан морь унах зөвшөөрлийг авдаг эсэх",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Бичгээр авдаг" },
      { value: "2", label: "Амаар авдаг" },
      { value: "3", label: "Авдаггүй" }
    ]
  },
  {
    id: "Q102",
    section_id: 6,
    section: "VI. Хичээлээс гадуур хөдөлмөр эрхлэлт",
    source_row: 2,
    source_column: 180,
    question: "Зөвшөөрлийг",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Ааваас" },
      { value: "2", label: "Ээжээс" },
      { value: "3", label: "Ах эгчээс" },
      { value: "4", label: "Зөвшөөрөл авахгүй унадаг" }
    ]
  },
  {
    id: "Q103",
    section_id: 6,
    section: "VI. Хичээлээс гадуур хөдөлмөр эрхлэлт",
    source_row: 2,
    source_column: 182,
    question: "Урамшуулал цалин авдаг эсэх",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "10,000 - 50,000₮" },
      { value: "2", label: "100,000 - 200,000₮" },
      { value: "3", label: "300,000 - 400,000₮" },
      { value: "4", label: "500,000 - 600,000₮" },
      { value: "5", label: "700,000 - 800,000₮" },
      { value: "6", label: "900,000 - 1,000,000₮" },
      { value: "7", label: "1,000,000₮-с дээш" },
      { value: "8", label: "Цалин урамшуулал авдаггүй" }
    ]
  },

  // SECTION VII: Нийгмийн болон сургуулийн орчны эрсдэл
  {
    id: "Q104",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 185,
    question: "Автобус микрогоор явдаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q105",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 187,
    question: "Хувийн унаагаараа явдаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "3", label: "Үгүй" }
    ]
  },
  {
    id: "Q106",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 189,
    question: "Таксигаар явдаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q107",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 191,
    question: "Зам хөндлөн гарч сургуульдаа явдаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q108",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 193,
    question: "Харанхуй гудамж жалгаар явж харьдаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q109",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 195,
    question: "Цахим мэдээллээс сөрөг мэдээлэл авч ашигладаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q110",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 197,
    question: "Автомашин унадаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q111",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 199,
    question: "Мотоцикл унадаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q112",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 201,
    question: "Моторт дугуй унадаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q113",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 203,
    question: "Жолооны үнэмлэхтэй",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q114",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 205,
    question: "Хичээлээс хоцордог",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q115",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 207,
    question: "Хичээлээ тасалдаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q116",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 209,
    question: "Сургууль дээр гадуурхагддаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q117",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 211,
    question: "Дотуур байрандаа гадуурхагддаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "3", label: "Үгүй" }
    ]
  },
  {
    id: "Q118",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 213,
    question: "Дотуур байрын багш, Багшийн ёс зүйгүй харилцаа, дарамтанд өртдөг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q119",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 215,
    question: "Үе тэнгийнхний дарамтанд өртдөг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q120",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 217,
    question: "Өөрийн сонирхсон үйл ажиллагаанд оролцож чаддаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q121",
    section_id: 7,
    section: "VII. Нийгмийн болон сургуулийн орчны эрсдэл",
    source_row: 2,
    source_column: 219,
    question: "Өөрийн сонирхсон үйл ажиллагаанд оролцож чаддаггүй",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },

  // SECTION VIII: Гэр бүлийн болон хувийн зан чанарын эрсдэл
  {
    id: "Q122",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 221,
    question: "Өрх толгойлон амьдардаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q123",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 223,
    question: "Гэр бүлийн хүчирхийлэлд өртдөг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q124",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 225,
    question: "Эцэг эх нь салсан",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q125",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 227,
    question: "Гэр нь хөдөө, эсвэл эцэг эх нь гадаадад амьдардаг учраас айлд байдаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q126",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 229,
    question: "Ар гэрийн хяналт сул",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q127",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 231,
    question: "Гэр бүлийн орчинд архины хамааралтай хүнтэй эсэх",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" },
      { value: "3", label: "Гаднаас хүмүүс ирдэг" }
    ]
  },
  {
    id: "Q128",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 233,
    question: "Гэр бүлийн орчинд дэмжлэг шаардлагатай асаргааны хүнтэй эсэх",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q129",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 235,
    question: "Айлд үрчлэгдсэн эсэх",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q130",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 237,
    question: "Эцэг эх нь сургуулиас ирж авдаггүй",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q131",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 239,
    question: "Гэр сургууль гэр маршрутаар харьдаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q132",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 241,
    question: "Гадуур тэнэдэг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q133",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 243,
    question: "Дээрэнгүй зан чанартай",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q134",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 245,
    question: "Ганцаардмал зожиг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q135",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 247,
    question: "Бүдүүлэг үг хэллэг хэрэглэдэг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q136",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 249,
    question: "Бусдыг уруу татдаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q137",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 251,
    question: "Хааяа аливаа үйлийг хийхдээ залхуурдаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q138",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 253,
    question: "Бусдын юмыг зөвшөөрөлгүй заримдаа авдаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q139",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 255,
    question: "Биеэ авч явах байдал хангалтгүй",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q140",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 257,
    question: "Архи пиво уудаг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q141",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 259,
    question: "Сэтгэцэд нөлөөлөх эм бодис хэрэглэдэг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q142",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 261,
    question: "Тамхи татдаг",
    type: "select",
    required: false,
    options: [
      { value: "1", label: "Электрон тамхи" },
      { value: "2", label: "Утаат тамхи" },
      { value: "3", label: "Татдаггүй" }
    ]
  },
  {
    id: "Q143",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 263,
    question: "Дэлгэцийн хамааралтай эсэх",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q144",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 265,
    question: "Цахим тоглоом болон мөрийтэй тоглодог эсэх",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  },
  {
    id: "Q145",
    section_id: 8,
    section: "VIII. Гэр бүлийн болон хувийн зан чанарын эрсдэл",
    source_row: 2,
    source_column: 267,
    question: "Хулгай хийдэг",
    type: "radio",
    required: false,
    options: [
      { value: "1", label: "Тийм" },
      { value: "2", label: "Үгүй" }
    ]
  }
];
