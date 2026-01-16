# Phase 2: 卒業要件チェック機能 - 詳細実装ガイド

## 2.1 TWINSパーサーの実装

### src/lib/parsers/twins-csv.ts

```typescript
import type { TwinsCourse, Grade, CourseCategory } from '../types';

// CSVをパース
export function parseTwinsCsv(csvContent: string): TwinsCourse[] {
  const lines = csvContent.trim().split('\n');

  // ヘッダー行をスキップ
  if (lines.length < 2) {
    throw new Error('CSVファイルにデータがありません');
  }

  // ヘッダー確認
  const header = lines[0];
  if (!header.includes('学籍番号') || !header.includes('科目番号')) {
    throw new Error('TWINSの成績CSVファイルではないようです');
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
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
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
    type
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
    year: parseInt(year) || new Date().getFullYear(),
    type
  };
}

// 成績をパース
function parseGrade(grade: string): Grade {
  const normalized = grade.trim();
  const validGrades: Grade[] = ['A+', 'A', 'B', 'C', 'D', 'P', '認', '履修中'];

  for (const g of validGrades) {
    if (normalized === g) return g;
  }

  return '-';
}

// 科目区分をパース
function parseCategory(category: string): CourseCategory {
  const normalized = category.trim().toUpperCase();
  if (normalized === 'A' || normalized === 'B' || normalized === 'C') {
    return normalized;
  }
  return 'C'; // デフォルト
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

    if (['A+', 'A', 'B', 'C', 'P', '認'].includes(course.finalGrade)) {
      passedCourses++;
      earnedCredits += course.credits;
    } else if (course.finalGrade === '履修中') {
      inProgressCourses++;
    } else if (course.finalGrade === 'D') {
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
      earnedCredits
    }
  };
}
```

## 2.2 要件判定ロジックの実装

### src/lib/calculator/requirements.ts

```typescript
import type {
  GraduationRequirements,
  RequirementStatus,
  CategoryStatus,
  SubcategoryStatus,
  RuleStatus,
  MatchedCourse,
  UserCourseRecord,
  RequirementRule
} from '../types';
import { isPassed, isInProgress } from '../types';

// 要件充足状況を計算
export function calculateRequirementStatus(
  requirements: GraduationRequirements,
  courses: UserCourseRecord[]
): RequirementStatus {
  // 各科目が使用済みかどうかを追跡（同じ科目を複数カテゴリでカウントしない）
  const usedCourseIds = new Set<string>();

  const categoryStatuses: CategoryStatus[] = requirements.categories.map(category => {
    const subcategoryStatuses: SubcategoryStatus[] = category.subcategories.map(subcategory => {
      const ruleStatuses: RuleStatus[] = [];
      const matchedCourses: MatchedCourse[] = [];

      for (const rule of subcategory.rules) {
        const ruleMatches = matchCoursesToRule(courses, rule, usedCourseIds);

        const earnedCredits = ruleMatches
          .filter(m => m.isPassed)
          .reduce((sum, m) => sum + m.credits, 0);

        const inProgressCredits = ruleMatches
          .filter(m => m.isInProgress)
          .reduce((sum, m) => sum + m.credits, 0);

        const isSatisfied = rule.required
          ? ruleMatches.every(m => m.isPassed || m.isInProgress)
          : (rule.minCredits ? earnedCredits >= rule.minCredits : true);

        ruleStatuses.push({
          ruleId: rule.id,
          description: rule.description || '',
          isSatisfied,
          earnedCredits,
          inProgressCredits,
          requiredCredits: rule.minCredits,
          matchedCourses: ruleMatches
        });

        matchedCourses.push(...ruleMatches);
      }

      const earnedCredits = matchedCourses
        .filter(m => m.isPassed)
        .reduce((sum, m) => sum + m.credits, 0);

      const inProgressCredits = matchedCourses
        .filter(m => m.isInProgress)
        .reduce((sum, m) => sum + m.credits, 0);

      const isSatisfied = earnedCredits >= subcategory.minCredits;

      return {
        subcategoryId: subcategory.id,
        subcategoryName: subcategory.name,
        earnedCredits,
        inProgressCredits,
        requiredCredits: subcategory.minCredits,
        maxCredits: subcategory.maxCredits,
        isSatisfied,
        ruleStatuses,
        matchedCourses
      };
    });

    const earnedCredits = subcategoryStatuses.reduce((sum, s) => sum + s.earnedCredits, 0);
    const inProgressCredits = subcategoryStatuses.reduce((sum, s) => sum + s.inProgressCredits, 0);
    const requiredCredits = category.minCredits ||
      subcategoryStatuses.reduce((sum, s) => sum + s.requiredCredits, 0);
    const isSatisfied = subcategoryStatuses.every(s => s.isSatisfied);

    return {
      categoryId: category.id,
      categoryName: category.name,
      earnedCredits,
      inProgressCredits,
      requiredCredits,
      maxCredits: category.maxCredits,
      isSatisfied,
      subcategoryStatuses
    };
  });

  const totalEarnedCredits = categoryStatuses.reduce((sum, c) => sum + c.earnedCredits, 0);
  const totalInProgressCredits = categoryStatuses.reduce((sum, c) => sum + c.inProgressCredits, 0);
  const isGraduationEligible = totalEarnedCredits >= requirements.totalCredits;

  return {
    requirementsId: requirements.id,
    totalEarnedCredits,
    totalInProgressCredits,
    totalRequiredCredits: requirements.totalCredits,
    isGraduationEligible,
    categoryStatuses,
    calculatedAt: new Date().toISOString()
  };
}

// 科目をルールにマッチング
function matchCoursesToRule(
  courses: UserCourseRecord[],
  rule: RequirementRule,
  usedCourseIds: Set<string>
): MatchedCourse[] {
  const matches: MatchedCourse[] = [];

  for (const course of courses) {
    // 既に使用済みの科目はスキップ
    if (usedCourseIds.has(course.id)) continue;

    let isMatch = false;

    switch (rule.type) {
      case 'specific':
        isMatch = rule.courseIds?.includes(course.courseId) || false;
        break;

      case 'pattern':
        if (rule.courseIdPattern) {
          const regex = new RegExp(rule.courseIdPattern);
          isMatch = regex.test(course.courseId);
        }
        break;

      case 'group':
        isMatch = rule.groupCourseIds?.includes(course.courseId) || false;
        break;
    }

    if (isMatch) {
      usedCourseIds.add(course.id);
      matches.push({
        courseId: course.courseId,
        courseName: course.courseName,
        credits: course.credits,
        grade: course.grade,
        isPassed: course.isPassed,
        isInProgress: course.isInProgress
      });
    }
  }

  return matches;
}
```

## 2.3 CSVアップローダーの実装

### src/components/graduation/CsvUploader.tsx

```typescript
import { Component, createSignal, Show } from 'solid-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { parseTwinsCsv, validateTwinsCourses, type ValidationResult } from '~/lib/parsers/twins-csv';
import type { TwinsCourse } from '~/lib/types';

interface CsvUploaderProps {
  onDataLoaded: (courses: TwinsCourse[], validation: ValidationResult) => void;
}

export const CsvUploader: Component<CsvUploaderProps> = (props) => {
  const [isDragging, setIsDragging] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);

  let fileInputRef: HTMLInputElement | undefined;

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('CSVファイルを選択してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const courses = parseTwinsCsv(content);
      const validation = validateTwinsCourses(courses);

      if (courses.length === 0) {
        setError('有効なデータが見つかりませんでした');
        return;
      }

      props.onDataLoaded(courses, validation);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ファイルの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer?.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef?.click();
  };

  const handleFileInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Card class="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>成績データをアップロード</CardTitle>
        <CardDescription>
          TWINSからダウンロードしたCSVファイルをアップロードしてください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          class={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors
            ${isDragging() ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            class="hidden"
            onChange={handleFileInput}
          />

          <Show when={isLoading()} fallback={
            <>
              <div class="text-4xl mb-4">📂</div>
              <p class="text-lg font-medium mb-2">
                CSVファイルをドラッグ＆ドロップ
              </p>
              <p class="text-sm text-muted-foreground">
                または クリックしてファイルを選択
              </p>
            </>
          }>
            <div class="text-4xl mb-4 animate-pulse">⏳</div>
            <p>読み込み中...</p>
          </Show>
        </div>

        <Show when={error()}>
          <Alert variant="destructive" class="mt-4">
            <AlertDescription>{error()}</AlertDescription>
          </Alert>
        </Show>

        <div class="mt-6 text-sm text-muted-foreground">
          <p class="font-medium mb-2">CSVファイルの取得方法:</p>
          <ol class="list-decimal list-inside space-y-1">
            <li>TWINSにログイン</li>
            <li>「成績」→「履修成績照会・成績証明書発行」を選択</li>
            <li>「CSV出力」ボタンをクリック</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
```

## 2.4 ドーナツチャートの実装

### チャートライブラリのインストール

```bash
npm install chart.js
```

### src/components/graduation/DonutChart.tsx

```typescript
import { Component, onMount, onCleanup, createEffect } from 'solid-js';
import { Chart, type ChartConfiguration, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import type { CategoryStatus } from '~/lib/types';

// Chart.jsのコンポーネントを登録
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

interface DonutChartProps {
  categoryStatuses: CategoryStatus[];
  totalEarned: number;
  totalRequired: number;
}

const categoryColors: Record<string, string> = {
  '専門科目': '#3b82f6',
  '専門基礎科目': '#8b5cf6',
  '共通科目': '#22c55e',
  '基礎科目': '#f97316',
};

export const DonutChart: Component<DonutChartProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let chartInstance: Chart | null = null;

  const getChartConfig = (): ChartConfiguration<'doughnut'> => {
    const labels = props.categoryStatuses.map(c => c.categoryName);
    const data = props.categoryStatuses.map(c => c.earnedCredits);
    const colors = props.categoryStatuses.map(c =>
      categoryColors[c.categoryName] || '#94a3b8'
    );

    return {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '70%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const category = props.categoryStatuses[context.dataIndex];
                return `${context.label}: ${category.earnedCredits}/${category.requiredCredits}単位`;
              }
            }
          }
        }
      }
    };
  };

  onMount(() => {
    if (canvasRef) {
      chartInstance = new Chart(canvasRef, getChartConfig());
    }
  });

  createEffect(() => {
    if (chartInstance) {
      const config = getChartConfig();
      chartInstance.data = config.data;
      chartInstance.update();
    }
  });

  onCleanup(() => {
    chartInstance?.destroy();
  });

  const percentage = Math.round((props.totalEarned / props.totalRequired) * 100);

  return (
    <div class="relative w-64 h-64 mx-auto">
      <canvas ref={canvasRef} />
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span class="text-3xl font-bold">{percentage}%</span>
        <span class="text-sm text-muted-foreground">
          {props.totalEarned}/{props.totalRequired}単位
        </span>
      </div>
    </div>
  );
};
```

## 2.5 要件ツリーの実装

### src/components/graduation/RequirementTree.tsx

```typescript
import { Component, For, Show, createSignal } from 'solid-js';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion';
import { Badge } from '~/components/ui/badge';
import type { CategoryStatus, SubcategoryStatus, MatchedCourse } from '~/lib/types';

interface RequirementTreeProps {
  categoryStatuses: CategoryStatus[];
}

export const RequirementTree: Component<RequirementTreeProps> = (props) => {
  return (
    <Accordion type="multiple" class="w-full">
      <For each={props.categoryStatuses}>
        {(category) => (
          <AccordionItem value={category.categoryId}>
            <AccordionTrigger class="hover:no-underline">
              <div class="flex items-center gap-3 w-full">
                <StatusIcon isSatisfied={category.isSatisfied} />
                <span class="font-medium">{category.categoryName}</span>
                <span class="text-sm text-muted-foreground ml-auto mr-4">
                  {category.earnedCredits}/{category.requiredCredits}単位
                  {category.inProgressCredits > 0 && (
                    <span class="text-blue-500"> (+{category.inProgressCredits}履修中)</span>
                  )}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div class="pl-6 space-y-2">
                <For each={category.subcategoryStatuses}>
                  {(subcategory) => (
                    <SubcategoryItem subcategory={subcategory} />
                  )}
                </For>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </For>
    </Accordion>
  );
};

const SubcategoryItem: Component<{ subcategory: SubcategoryStatus }> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <div class="border rounded-lg p-3">
      <button
        class="flex items-center gap-3 w-full text-left"
        onClick={() => setIsOpen(!isOpen())}
      >
        <StatusIcon isSatisfied={props.subcategory.isSatisfied} />
        <span class="font-medium text-sm">{props.subcategory.subcategoryName}</span>
        <span class="text-xs text-muted-foreground ml-auto">
          {props.subcategory.earnedCredits}/{props.subcategory.requiredCredits}単位
        </span>
        <span class="text-xs">{isOpen() ? '▲' : '▼'}</span>
      </button>

      <Show when={isOpen()}>
        <div class="mt-3 pl-6 space-y-1">
          <For each={props.subcategory.matchedCourses}>
            {(course) => (
              <CourseItem course={course} />
            )}
          </For>
          <Show when={props.subcategory.matchedCourses.length === 0}>
            <p class="text-sm text-muted-foreground">該当する科目がありません</p>
          </Show>
        </div>
      </Show>
    </div>
  );
};

const CourseItem: Component<{ course: MatchedCourse }> = (props) => {
  return (
    <div class="flex items-center gap-2 text-sm py-1">
      <StatusIcon isSatisfied={props.course.isPassed} isInProgress={props.course.isInProgress} />
      <span>{props.course.courseName}</span>
      <span class="text-muted-foreground">({props.course.credits}単位)</span>
      <GradeBadge grade={props.course.grade} />
    </div>
  );
};

const StatusIcon: Component<{ isSatisfied: boolean; isInProgress?: boolean }> = (props) => {
  if (props.isInProgress) {
    return <span class="text-blue-500">🔵</span>;
  }
  return props.isSatisfied
    ? <span class="text-green-500">✅</span>
    : <span class="text-yellow-500">🟡</span>;
};

const GradeBadge: Component<{ grade: string }> = (props) => {
  const variants: Record<string, string> = {
    'A+': 'bg-green-500',
    'A': 'bg-lime-500',
    'B': 'bg-yellow-500',
    'C': 'bg-orange-500',
    'D': 'bg-red-500',
    'P': 'bg-purple-500',
    '認': 'bg-purple-500',
    '履修中': 'bg-blue-500',
  };

  return (
    <Badge class={`${variants[props.grade] || 'bg-gray-500'} text-white text-xs`}>
      {props.grade}
    </Badge>
  );
};
```

## 2.6 サマリー表示の実装

### src/components/graduation/RequirementsSummary.tsx

```typescript
import { Component, Show } from 'solid-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import type { RequirementStatus } from '~/lib/types';

interface RequirementsSummaryProps {
  status: RequirementStatus;
  requirementsName: string;
}

export const RequirementsSummary: Component<RequirementsSummaryProps> = (props) => {
  const remaining = () => props.status.totalRequiredCredits - props.status.totalEarnedCredits;
  const potentialTotal = () => props.status.totalEarnedCredits + props.status.totalInProgressCredits;

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader class="pb-2">
          <CardDescription>卒業判定</CardDescription>
          <CardTitle class="text-2xl flex items-center gap-2">
            <Show
              when={props.status.isGraduationEligible}
              fallback={
                <>
                  <span class="text-yellow-500">🟡</span>
                  <span>あと{remaining()}単位</span>
                </>
              }
            >
              <span class="text-green-500">✅</span>
              <span>卒業可能</span>
            </Show>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            {props.requirementsName}
          </p>
          <Show when={props.status.totalInProgressCredits > 0}>
            <p class="text-sm text-blue-500 mt-1">
              履修中の単位を含めると {potentialTotal()}/{props.status.totalRequiredCredits}
            </p>
          </Show>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardDescription>取得単位数</CardDescription>
          <CardTitle class="text-2xl">
            {props.status.totalEarnedCredits} / {props.status.totalRequiredCredits}
            <span class="text-base text-muted-foreground ml-2">単位</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                class="h-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, (props.status.totalEarnedCredits / props.status.totalRequiredCredits) * 100)}%`
                }}
              />
            </div>
            <span class="text-sm font-medium">
              {Math.round((props.status.totalEarnedCredits / props.status.totalRequiredCredits) * 100)}%
            </span>
          </div>
          <Show when={props.status.totalInProgressCredits > 0}>
            <Badge variant="outline" class="mt-2">
              +{props.status.totalInProgressCredits}単位 履修中
            </Badge>
          </Show>
        </CardContent>
      </Card>
    </div>
  );
};
```

## 2.7 メインコンポーネントの実装

### src/components/graduation/GraduationChecker.tsx

```typescript
import { Component, Show, createSignal, createEffect } from 'solid-js';
import { CsvUploader } from './CsvUploader';
import { RequirementsSummary } from './RequirementsSummary';
import { DonutChart } from './DonutChart';
import { RequirementTree } from './RequirementTree';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import type {
  GraduationRequirements,
  RequirementStatus,
  EnrollmentData,
  TwinsCourse
} from '~/lib/types';
import type { ValidationResult } from '~/lib/parsers/twins-csv';
import { calculateRequirementStatus } from '~/lib/calculator/requirements';
import { updateEnrollmentFromTwins, getEnrollment } from '~/lib/db/enrollment';
import { getCurrentProfile } from '~/lib/db/profiles';

interface GraduationCheckerProps {
  requirements: GraduationRequirements | null;
  enrollment: EnrollmentData | null;
  onEnrollmentUpdate: (enrollment: EnrollmentData) => void;
  onEditRequirements: () => void;
}

export const GraduationChecker: Component<GraduationCheckerProps> = (props) => {
  const [status, setStatus] = createSignal<RequirementStatus | null>(null);
  const [showUploader, setShowUploader] = createSignal(!props.enrollment);

  // 要件充足状況を計算
  createEffect(() => {
    if (props.requirements && props.enrollment) {
      const calculated = calculateRequirementStatus(
        props.requirements,
        props.enrollment.courses
      );
      setStatus(calculated);
    }
  });

  const handleDataLoaded = async (courses: TwinsCourse[], validation: ValidationResult) => {
    const profile = await getCurrentProfile();
    if (!profile) return;

    const enrollment = await updateEnrollmentFromTwins(profile.id, courses);
    props.onEnrollmentUpdate(enrollment);
    setShowUploader(false);
  };

  const handleReupload = () => {
    setShowUploader(true);
  };

  return (
    <div class="space-y-6">
      <Show when={showUploader()}>
        <CsvUploader onDataLoaded={handleDataLoaded} />

        <Show when={props.enrollment}>
          <div class="text-center">
            <Button variant="link" onClick={() => setShowUploader(false)}>
              既存のデータを使用する
            </Button>
          </div>
        </Show>
      </Show>

      <Show when={!showUploader() && status() && props.requirements}>
        <RequirementsSummary
          status={status()!}
          requirementsName={props.requirements!.name}
        />

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card class="lg:col-span-1">
            <CardHeader>
              <CardTitle class="text-lg">進捗状況</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart
                categoryStatuses={status()!.categoryStatuses}
                totalEarned={status()!.totalEarnedCredits}
                totalRequired={status()!.totalRequiredCredits}
              />

              {/* 凡例 */}
              <div class="mt-4 space-y-2">
                {status()!.categoryStatuses.map(cat => (
                  <div class="flex items-center gap-2 text-sm">
                    <div
                      class="w-3 h-3 rounded"
                      style={{ 'background-color': getCategoryColor(cat.categoryName) }}
                    />
                    <span>{cat.categoryName}</span>
                    <span class="ml-auto text-muted-foreground">
                      {cat.earnedCredits}/{cat.requiredCredits}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card class="lg:col-span-2">
            <CardHeader class="flex flex-row items-center justify-between">
              <CardTitle class="text-lg">詳細要件</CardTitle>
              <div class="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReupload}>
                  データ更新
                </Button>
                <Button variant="outline" size="sm" onClick={props.onEditRequirements}>
                  要件編集
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <RequirementTree categoryStatuses={status()!.categoryStatuses} />
            </CardContent>
          </Card>
        </div>
      </Show>

      <Show when={!showUploader() && !props.requirements}>
        <Card>
          <CardContent class="py-12 text-center">
            <p class="text-muted-foreground mb-4">
              卒業要件が設定されていません
            </p>
            <Button onClick={props.onEditRequirements}>
              卒業要件を設定
            </Button>
          </CardContent>
        </Card>
      </Show>
    </div>
  );
};

function getCategoryColor(name: string): string {
  const colors: Record<string, string> = {
    '専門科目': '#3b82f6',
    '専門基礎科目': '#8b5cf6',
    '共通科目': '#22c55e',
    '基礎科目': '#f97316',
  };
  return colors[name] || '#94a3b8';
}
```

## 2.8 デフォルト要件データ

### src/data/default-requirements.ts

```typescript
import type { GraduationRequirements } from '~/lib/types';

export const defaultRequirements: GraduationRequirements = {
  id: 'esys-2024',
  name: '2024年入学 工学システム学類',
  year: 2024,
  department: '工学システム学類',
  totalCredits: 125,
  version: '1.0.0',
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  categories: [
    {
      id: 'specialized',
      name: '専門科目',
      minCredits: 65,
      subcategories: [
        {
          id: 'specialized-required',
          name: '必修科目',
          type: 'required',
          minCredits: 25,
          rules: [
            {
              id: 'prog-c',
              type: 'specific',
              courseIds: ['FG20204'],
              description: 'プログラミング序論C',
              required: true
            },
            {
              id: 'prog-d',
              type: 'specific',
              courseIds: ['FG20214'],
              description: 'プログラミング序論D',
              required: true
            },
            {
              id: 'exp-a',
              type: 'specific',
              courseIds: ['FG19103'],
              description: '工学システム基礎実験A',
              required: true
            },
            {
              id: 'exp-b',
              type: 'specific',
              courseIds: ['FG19113'],
              description: '工学システム基礎実験B',
              required: true
            },
            {
              id: 'eng-a',
              type: 'specific',
              courseIds: ['FG18112'],
              description: '専門英語A',
              required: true
            },
            {
              id: 'eng-b',
              type: 'specific',
              courseIds: ['FG20222'],
              description: '専門英語B',
              required: true
            },
            {
              id: 'fg17-24-25',
              type: 'pattern',
              courseIdPattern: '^FG(17|24|25)',
              description: 'FG17, FG24, FG25で始まる授業科目',
              minCredits: 16
            }
          ]
        },
        {
          id: 'specialized-elective',
          name: '選択科目',
          type: 'elective',
          minCredits: 40,
          maxCredits: 49,
          rules: [
            {
              id: 'fg-ff-gb',
              type: 'pattern',
              courseIdPattern: '^(FG|FF|GB)',
              description: 'FG, FF, GBで始まる専門選択科目'
            }
          ]
        }
      ]
    },
    {
      id: 'foundation',
      name: '専門基礎科目',
      minCredits: 31,
      subcategories: [
        {
          id: 'foundation-required',
          name: '必修科目',
          type: 'required',
          minCredits: 31,
          rules: [
            {
              id: 'math-literacy',
              type: 'specific',
              courseIds: ['FA01141', 'FA01241'],
              description: '数学リテラシー1, 2',
              required: true
            },
            {
              id: 'linear-algebra',
              type: 'specific',
              courseIds: ['FA01641', 'FA01741', 'FA01841'],
              description: '線形代数1, 2, 3',
              required: true
            },
            {
              id: 'calculus',
              type: 'specific',
              courseIds: ['FA01341', 'FA01441', 'FA01541'],
              description: '微積分1, 2, 3',
              required: true
            },
            {
              id: 'mechanics',
              type: 'specific',
              courseIds: ['FCB1201', 'FCB1241', 'FCB1291'],
              description: '力学1, 2, 3',
              required: true
            },
            {
              id: 'em',
              type: 'specific',
              courseIds: ['FCB1321', 'FCB1361', 'FCB1381'],
              description: '電磁気学1, 2, 3',
              required: true
            },
            {
              id: 'esys-intro',
              type: 'specific',
              courseIds: ['FG10651'],
              description: '工学システム原論',
              required: true
            },
            {
              id: 'la-adv',
              type: 'specific',
              courseIds: ['FG10704', 'FG10724'],
              description: '線形代数総論A, B',
              required: true
            },
            {
              id: 'analysis',
              type: 'specific',
              courseIds: ['FG10744'],
              description: '解析学総論',
              required: true
            },
            {
              id: 'ode',
              type: 'specific',
              courseIds: ['FG10764'],
              description: '常微分方程式',
              required: true
            },
            {
              id: 'mech-adv',
              type: 'specific',
              courseIds: ['FG10814'],
              description: '力学総論',
              required: true
            },
            {
              id: 'em-adv',
              type: 'specific',
              courseIds: ['FG10834'],
              description: '電磁気学総論',
              required: true
            },
            {
              id: 'material',
              type: 'specific',
              courseIds: ['FG10864'],
              description: '材料力学基礎',
              required: true
            },
            {
              id: 'thermo',
              type: 'specific',
              courseIds: ['FG10911'],
              description: '熱力学基礎',
              required: true
            },
            {
              id: 'fluid',
              type: 'specific',
              courseIds: ['FG10851'],
              description: '流体力学基礎',
              required: true
            },
            {
              id: 'complex',
              type: 'specific',
              courseIds: ['FG10784'],
              description: '複素解析',
              required: true
            },
            {
              id: 'prog-a',
              type: 'specific',
              courseIds: ['FG10874'],
              description: 'プログラミング序論A',
              required: true
            },
            {
              id: 'prog-b',
              type: 'specific',
              courseIds: ['FG10904'],
              description: 'プログラミング序論B',
              required: true
            }
          ]
        }
      ]
    },
    {
      id: 'common',
      name: '共通科目',
      minCredits: 13,
      subcategories: [
        {
          id: 'common-fys',
          name: '総合科目（FYS、学問への誘い）',
          type: 'required',
          minCredits: 2,
          rules: [
            {
              id: 'fys',
              type: 'specific',
              courseIds: ['1116302'],
              description: 'ファーストイヤーセミナー',
              required: true
            },
            {
              id: 'intro',
              type: 'specific',
              courseIds: ['1227491'],
              description: '学問への誘い',
              required: true
            }
          ]
        },
        {
          id: 'common-bachelor',
          name: '総合科目（学士基礎科目）',
          type: 'elective',
          minCredits: 1,
          maxCredits: 3,
          rules: []
        },
        {
          id: 'common-pe',
          name: '体育',
          type: 'required',
          minCredits: 3,
          rules: [
            {
              id: 'pe',
              type: 'pattern',
              courseIdPattern: '^21[0-9]{5}',
              description: '体育科目'
            }
          ]
        },
        {
          id: 'common-english',
          name: '第1外国語（英語）',
          type: 'required',
          minCredits: 4,
          rules: [
            {
              id: 'english',
              type: 'pattern',
              courseIdPattern: '^31[A-Z]{2}',
              description: '英語科目'
            }
          ]
        },
        {
          id: 'common-second',
          name: '第2外国語（初修外国語）',
          type: 'elective',
          minCredits: 0,
          maxCredits: 4,
          rules: [
            {
              id: 'second-lang',
              type: 'pattern',
              courseIdPattern: '^34[A-Z0-9]{2}',
              description: '初修外国語'
            }
          ]
        }
      ]
    },
    {
      id: 'basic',
      name: '基礎科目',
      minCredits: 6,
      maxCredits: 15,
      subcategories: [
        {
          id: 'basic-other',
          name: '他学群又は他学類の授業科目',
          type: 'elective',
          minCredits: 6,
          maxCredits: 15,
          rules: [
            {
              id: 'other-dept',
              type: 'pattern',
              courseIdPattern: '^(GB|GC|GA|GE|BC)',
              description: '他学類の科目'
            }
          ],
          notes: '情報学群、他学類の科目'
        }
      ]
    }
  ]
};
```

## Phase 2 完了チェックリスト

- [ ] 2.1 TWINSパーサー実装
  - [ ] CSVパース関数
  - [ ] バリデーション関数
- [ ] 2.2 要件判定ロジック実装
  - [ ] isPassed関数
  - [ ] matchCoursesToRule関数
  - [ ] calculateRequirementStatus関数
- [ ] 2.3 CSVアップローダー実装
  - [ ] ドラッグ&ドロップ
  - [ ] ファイル選択
  - [ ] エラーハンドリング
- [ ] 2.4 ドーナツチャート実装
  - [ ] Chart.jsインストール
  - [ ] DonutChartコンポーネント
- [ ] 2.5 要件ツリー実装
  - [ ] RequirementTreeコンポーネント
  - [ ] 折りたたみ機能
- [ ] 2.6 サマリー表示実装
  - [ ] RequirementsSummaryコンポーネント
- [ ] 2.7 メインコンポーネント実装
  - [ ] GraduationCheckerコンポーネント
- [ ] 2.8 デフォルト要件データ作成
  - [ ] default-requirements.ts
- [ ] 動作確認
