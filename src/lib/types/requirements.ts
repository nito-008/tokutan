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
}

// サブカテゴリ
interface RequirementSubcategoryBase {
  id: string;
  name: string;
  notes?: string;
}

export type RequirementSubcategory =
  | (RequirementSubcategoryBase & {
      type: "required";
      courseIds: string[];
    })
  | (RequirementSubcategoryBase & {
      type: "elective" | "free";
      minCredits: number;
      maxCredits?: number;
      rules: RequirementRule[];
    });

// ルール
interface RequirementRuleBase {
  id: string;
  description: string;
  minCredits?: number;
}

export type RequirementRule =
  | (RequirementRuleBase & {
      type: "specific";
      courseIds: string[];
    })
  | (RequirementRuleBase & {
      type: "pattern";
      courseIdPattern: string;
    });

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
