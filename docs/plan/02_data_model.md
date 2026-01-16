# データモデル設計

## 概要

アプリケーションで扱うデータの詳細設計。

## データソース

### 1. kdb (科目データベース)

**取得元**: https://raw.githubusercontent.com/s7tya/kdb-crawler/master/dist/kdb.json

**フォーマット**:
```typescript
interface KdbCourse {
  科目番号: string;
  科目名: string;
  授業方法: string;
  単位数: string;         // "2.0" のような文字列
  標準履修年次: string;
  実施学期: string;        // "春AB", "秋C", "通年" など
  曜時限: string;
  担当教員: string;
  授業概要: string;
  備考: string;
  データ更新日: string;
}
```

**変換後の内部形式**:
```typescript
interface Course {
  id: string;              // 科目番号
  name: string;            // 科目名
  method: string;          // 授業方法
  credits: number;         // 単位数（数値に変換）
  gradeYear: number;       // 標準履修年次
  semester: string;        // 実施学期
  schedule: string;        // 曜時限
  instructor: string;      // 担当教員
  description: string;     // 授業概要
  notes: string;           // 備考
  updatedAt: string;       // データ更新日
}
```

### 2. TWINS CSV (成績データ)

**フォーマット**:
```csv
"学籍番号","学生氏名","科目番号","科目名 ","単位数","春学期","秋学期","総合評価","科目区分","開講年度","開講区分"
"202412836","筑波 太郎","GB30504","プログラム言語処理"," 2.0","-","-","A+","A","2025","通常"
```

**変換後の内部形式**:
```typescript
interface TwinsCourse {
  studentId: string;       // 学籍番号
  studentName: string;     // 学生氏名
  courseId: string;        // 科目番号
  courseName: string;      // 科目名
  credits: number;         // 単位数
  springGrade: string;     // 春学期成績
  fallGrade: string;       // 秋学期成績
  finalGrade: Grade;       // 総合評価
  category: CourseCategory; // 科目区分
  year: number;            // 開講年度
  type: string;            // 開講区分
}

type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'P' | '認' | '履修中' | '-';

type CourseCategory = 'A' | 'B' | 'C';  // A:専門, B:専門基礎, C:共通
```

## アプリケーションデータ

### 3. ユーザープロファイル

```typescript
interface UserProfile {
  id: string;               // UUID
  name: string;             // 表示名（任意）
  studentId?: string;       // 学籍番号（TWINSから自動取得）
  enrollmentYear: number;   // 入学年度
  department: string;       // 学類
  createdAt: string;
  updatedAt: string;
}
```

### 4. 卒業要件定義

```typescript
interface GraduationRequirements {
  id: string;
  name: string;
  year: number;
  department: string;
  totalCredits: number;
  categories: RequirementCategory[];
  version: string;
  createdAt: string;
  updatedAt: string;
}

interface RequirementCategory {
  id: string;
  name: string;
  subcategories: RequirementSubcategory[];
  minCredits?: number;
  maxCredits?: number;
}

interface RequirementSubcategory {
  id: string;
  name: string;
  type: 'required' | 'elective' | 'free';
  minCredits: number;
  maxCredits?: number;
  rules: RequirementRule[];
  notes?: string;
}

interface RequirementRule {
  id: string;
  type: 'specific' | 'pattern' | 'group';
  description?: string;
  courseIds?: string[];
  courseIdPattern?: string;
  groupName?: string;
  groupCourseIds?: string[];
  minCredits?: number;
  maxCredits?: number;
  required?: boolean;
}
```

### 5. 履修データ

```typescript
interface EnrollmentData {
  id: string;
  profileId: string;        // ユーザープロファイルへの参照
  courses: UserCourseRecord[];
  importedAt: string;       // TWINSデータインポート日時
  updatedAt: string;
}

interface UserCourseRecord {
  id: string;
  courseId: string;         // 科目番号
  courseName: string;       // 科目名
  credits: number;          // 単位数
  grade: Grade;             // 成績
  year: number;             // 開講年度
  semester: 'spring' | 'fall' | 'full';
  category: CourseCategory; // 科目区分
  isPassed: boolean;        // 合格フラグ（計算済み）
  isInProgress: boolean;    // 履修中フラグ
}
```

### 6. 履修計画（4年間の履修管理用）

```typescript
interface CoursePlan {
  id: string;
  profileId: string;
  plans: SemesterPlan[];
  createdAt: string;
  updatedAt: string;
}

interface SemesterPlan {
  year: number;             // 年度
  semester: 'spring' | 'fall';
  courses: PlannedCourse[];
}

interface PlannedCourse {
  courseId: string;
  courseName: string;
  credits: number;
  status: 'planned' | 'enrolled' | 'completed' | 'failed';
  actualGrade?: Grade;      // 実際の成績（TWINSから反映）
  notes?: string;
}
```

## 計算データ（派生データ）

### 7. 要件充足状況

```typescript
interface RequirementStatus {
  requirementsId: string;
  profileId: string;
  totalEarnedCredits: number;
  totalRequiredCredits: number;
  isGraduationEligible: boolean;
  categoryStatuses: CategoryStatus[];
  calculatedAt: string;
}

interface CategoryStatus {
  categoryId: string;
  categoryName: string;
  earnedCredits: number;
  requiredCredits: number;
  maxCredits?: number;
  isSatisfied: boolean;
  subcategoryStatuses: SubcategoryStatus[];
}

interface SubcategoryStatus {
  subcategoryId: string;
  subcategoryName: string;
  earnedCredits: number;
  requiredCredits: number;
  maxCredits?: number;
  isSatisfied: boolean;
  ruleStatuses: RuleStatus[];
  matchedCourses: MatchedCourse[];
}

interface RuleStatus {
  ruleId: string;
  description: string;
  isSatisfied: boolean;
  earnedCredits: number;
  requiredCredits?: number;
  matchedCourses: MatchedCourse[];
}

interface MatchedCourse {
  courseId: string;
  courseName: string;
  credits: number;
  grade: Grade;
  isPassed: boolean;
}
```

## データフロー

```
┌─────────────────┐     ┌─────────────────┐
│   TWINS CSV     │     │    kdb.json     │
│  (ユーザー入力)  │     │  (外部データ)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  TWINSパーサー   │     │  kdbキャッシュ   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│              IndexedDB                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │UserProfile│ │Enrollment│ │CoursePlan││
│  └──────────┘ └──────────┘ └──────────┘│
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │GradReqs  │ │kdbCache  │ │Settings  ││
│  └──────────┘ └──────────┘ └──────────┘│
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│          計算エンジン                    │
│  - 要件マッチング                        │
│  - 単位集計                              │
│  - 充足判定                              │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│          UI表示                          │
│  - ドーナツチャート                      │
│  - 詳細テーブル                          │
│  - 履修管理ビュー                        │
└─────────────────────────────────────────┘
```

## データ関連図

```
UserProfile (1) ──────────┬────────── (1) EnrollmentData
                         │
                         │
                         ├────────── (1) CoursePlan
                         │
                         │
                         └────────── (*) GraduationRequirements
                                          (選択して使用)

GraduationRequirements (1) ────── (*) RequirementCategory
                                       │
RequirementCategory (1) ───────── (*) RequirementSubcategory
                                       │
RequirementSubcategory (1) ────── (*) RequirementRule


Course (kdb) ◇─────────────────── UserCourseRecord
                                  (courseIdで参照)
```

## バリデーションルール

1. **科目番号**: 空でない文字列
2. **単位数**: 0.5以上の数値
3. **成績**: 有効な成績値のみ
4. **年度**: 2000〜2100の範囲
5. **必要単位数**: 0以上の整数
