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

export type SubcategoryType = "required" | "elective" | "free";

// サブカテゴリ
interface RequirementSubcategoryBase {
  id: string;
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
      groups: RequirementGroup[];
    });

// グループ内ルール
interface GroupRuleBase {
  id: string;
}

export type GroupRule =
  | (GroupRuleBase & {
      type: "specific";
      courseIds: string[];
    })
  | (GroupRuleBase & {
      type: "prefix";
      prefix: string;
    })
  | (GroupRuleBase & {
      type: "exclude";
      courseIds: string[];
    });

// 要件グループ
export interface RequirementGroup {
  id: string;
  minCredits: number;
  maxCredits?: number;
  rules: GroupRule[];
}

// 要件充足状況
export interface RequirementStatus {
  requirementsId: string;
  totalEarnedCredits: number;
  totalInProgressCredits: number;
  totalRequiredCredits: number;
  isGraduationEligible: boolean;
  categoryStatuses: CategoryStatus[];
  unmatchedCourses?: MatchedCourse[];
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
  subcategoryType: SubcategoryType;
  earnedCredits: number;
  inProgressCredits: number;
  requiredCredits: number;
  maxCredits?: number;
  isSatisfied: boolean;
  groupStatuses: GroupStatus[];
  matchedCourses: MatchedCourse[];
}

export interface GroupStatus {
  groupId: string;
  isSatisfied: boolean;
  earnedCredits: number;
  inProgressCredits: number;
  requiredCredits: number;
  maxCredits?: number;
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
