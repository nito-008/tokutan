// 卒業要件全体
export interface GraduationRequirements {
  id: string;
  name: string;
  year: number;
  department: string;
  totalCredits: number;
  categories: RequirementCategory[];
  version: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

// 要件カテゴリ
export interface RequirementCategory {
  id: string;
  name: string;
  subcategories: RequirementSubcategory[];
  minCredits?: number;
  maxCredits?: number;
}

// サブカテゴリ
export interface RequirementSubcategory {
  id: string;
  name: string;
  type: "required" | "elective" | "free";
  minCredits: number;
  maxCredits?: number;
  rules: RequirementRule[];
  notes?: string;
}

// ルール
export interface RequirementRule {
  id: string;
  type: "specific" | "pattern";
  description?: string;
  courseIds?: string[];
  courseIdPattern?: string;
  minCredits?: number;
  maxCredits?: number;
  required?: boolean;
}

// 要件充足状況
export interface RequirementStatus {
  requirementsId: string;
  totalEarnedCredits: number;
  totalInProgressCredits: number;
  totalRequiredCredits: number;
  isGraduationEligible: boolean;
  categoryStatuses: CategoryStatus[];
  calculatedAt: string;
}

export interface CategoryStatus {
  categoryId: string;
  categoryName: string;
  earnedCredits: number;
  inProgressCredits: number;
  requiredCredits: number;
  maxCredits?: number;
  isSatisfied: boolean;
  subcategoryStatuses: SubcategoryStatus[];
}

export interface SubcategoryStatus {
  subcategoryId: string;
  subcategoryName: string;
  earnedCredits: number;
  inProgressCredits: number;
  requiredCredits: number;
  maxCredits?: number;
  isSatisfied: boolean;
  ruleStatuses: RuleStatus[];
  matchedCourses: MatchedCourse[];
}

export interface RuleStatus {
  ruleId: string;
  description: string;
  isSatisfied: boolean;
  earnedCredits: number;
  inProgressCredits: number;
  requiredCredits?: number;
  matchedCourses: MatchedCourse[];
}

export interface MatchedCourse {
  courseId: string;
  courseName: string;
  credits: number;
  grade: string;
  isPassed: boolean;
  isInProgress: boolean;
  isUnregistered?: boolean;
}
