import type { CourseCategory, Grade, TwinsCourse } from "~/types";

// CSVをパース
export function parseTwinsCsv(csvContent: string): TwinsCourse[] {
  const lines = csvContent.trim().split("\n");

  // ヘッダー行をスキップ
  if (lines.length < 2) {
    throw new Error("CSVファイルにデータがありません");
  }

  // ヘッダー確認
  const header = lines[0];
  if (!header.includes("学籍番号") || !header.includes("科目番号")) {
    throw new Error("TWINSの成績CSVファイルではないようです");
  }

  const courses: TwinsCourse[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const course = parseCsvLine(line);
      if (course) {
        courses.push(course);
      }
    } catch (e) {
      console.warn(`行 ${i + 1} のパースに失敗:`, e);
    }
  }

  return courses;
}

// CSV行をパース（ダブルクォートとカンマを考慮）
function parseCsvLine(line: string): TwinsCourse | null {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  // 必要なフィールド数を確認
  if (values.length < 11) {
    return null;
  }

  const [
    studentId,
    studentName,
    courseId,
    courseName,
    credits,
    springGrade,
    fallGrade,
    finalGrade,
    category,
    year,
    type,
  ] = values;

  // 科目番号がない場合はスキップ
  if (!courseId) {
    return null;
  }

  return {
    studentId,
    studentName,
    courseId,
    courseName: courseName.trim(),
    credits: parseFloat(credits) || 0,
    springGrade,
    fallGrade,
    finalGrade: parseGrade(finalGrade),
    category: parseCategory(category),
    year: parseInt(year, 10) || new Date().getFullYear(),
    type,
  };
}

// 成績をパース
function parseGrade(grade: string): Grade {
  const normalized = grade.trim();
  const validGrades: Grade[] = ["A+", "A", "B", "C", "D", "P", "認", "履修中"];

  for (const g of validGrades) {
    if (normalized === g) return g;
  }

  return "-";
}

// 科目区分をパース
function parseCategory(category: string): CourseCategory {
  const normalized = category.trim().toUpperCase();
  if (normalized === "A" || normalized === "B" || normalized === "C") {
    return normalized;
  }
  return "C"; // デフォルト
}

// バリデーション結果
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalCourses: number;
    passedCourses: number;
    inProgressCourses: number;
    failedCourses: number;
    totalCredits: number;
    earnedCredits: number;
  };
}

// バリデーション
export function validateTwinsCourses(courses: TwinsCourse[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let passedCourses = 0;
  let inProgressCourses = 0;
  let failedCourses = 0;
  let earnedCredits = 0;
  let totalCredits = 0;

  for (const course of courses) {
    totalCredits += course.credits;

    if (["A+", "A", "B", "C", "P", "認"].includes(course.finalGrade)) {
      passedCourses++;
      earnedCredits += course.credits;
    } else if (course.finalGrade === "履修中") {
      inProgressCourses++;
    } else if (course.finalGrade === "D") {
      failedCourses++;
    }

    // 警告チェック
    if (course.credits <= 0) {
      warnings.push(`${course.courseName}: 単位数が0以下です`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalCourses: courses.length,
      passedCourses,
      inProgressCourses,
      failedCourses,
      totalCredits,
      earnedCredits,
    },
  };
}
