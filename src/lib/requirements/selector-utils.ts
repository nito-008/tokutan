import type { GraduationRequirements } from "~/types";

export interface YearOption {
  value: number;
  label: string;
}

export interface DepartmentOption {
  value: string;
  label: string;
}

export interface MajorOption {
  value: string | null;
  label: string;
}

/**
 * 全要件から利用可能な年度一覧を抽出（重複なし、降順）
 */
export function getAvailableYears(
  requirements: GraduationRequirements[],
): YearOption[] {
  const years = [...new Set(requirements.map((r) => r.year))].sort(
    (a, b) => b - a,
  );
  return years.map((year) => ({
    value: year,
    label: `${year}年入学`,
  }));
}

/**
 * 指定年度で利用可能な学類一覧を抽出（重複なし）
 */
export function getAvailableDepartments(
  requirements: GraduationRequirements[],
  year: number,
): DepartmentOption[] {
  const departments = [
    ...new Set(requirements.filter((r) => r.year === year).map((r) => r.department)),
  ];
  return departments.map((dept) => ({
    value: dept,
    label: dept,
  }));
}

/**
 * 指定年度・学類で利用可能な専攻一覧を抽出
 * 専攻がない要件のみの場合は空配列を返す
 */
export function getAvailableMajors(
  requirements: GraduationRequirements[],
  year: number,
  department: string,
): MajorOption[] {
  const filtered = requirements.filter(
    (r) => r.year === year && r.department === department,
  );

  const majors = filtered
    .map((r) => r.major)
    .filter((major): major is string => major !== undefined && major !== null);

  if (majors.length === 0) {
    return [];
  }

  return majors.map((major) => ({
    value: major,
    label: major,
  }));
}

/**
 * 年度・学類・専攻から要件を特定
 */
export function findRequirement(
  requirements: GraduationRequirements[],
  year: number,
  department: string,
  major: string | null,
): GraduationRequirements | undefined {
  return requirements.find((r) => {
    if (r.year !== year || r.department !== department) return false;
    if (major === null) {
      return r.major === undefined || r.major === null;
    }
    return r.major === major;
  });
}
