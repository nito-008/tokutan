import { type Component, createSignal, For, onMount, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  addCourseToSemester,
  ensureCoursePlan,
  getCoursePlan,
  removeCourseFromSemester,
  updateCourseInPlan,
} from "~/lib/db/coursePlans";
import { refreshKdbCache } from "~/lib/db/kdb";
import type { CoursePlan, EnrollmentData, PlannedCourse, UserCourseRecord } from "~/lib/types";
import { SemesterView } from "./SemesterView";

interface CourseManagerProps {
  profileId: string;
  enrollmentYear: number;
  enrollment: EnrollmentData | null;
  onSyncTwins: () => void;
}

export const CourseManager: Component<CourseManagerProps> = (props) => {
  const [plan, setPlan] = createSignal<CoursePlan | null>(null);
  const [selectedYear, setSelectedYear] = createSignal<number>(props.enrollmentYear);
  const [isLoading, setIsLoading] = createSignal(true);
  const [isRefreshingKdb, setIsRefreshingKdb] = createSignal(false);

  // 履修計画を読み込み
  onMount(async () => {
    const existingPlan = await ensureCoursePlan(props.profileId, props.enrollmentYear);
    setPlan(existingPlan);
    setIsLoading(false);
  });

  // 選択した年度の学期を取得
  const yearSemesters = () => {
    const p = plan();
    if (!p) return [];
    return p.plans.filter((s) => s.year === selectedYear());
  };

  // 選択した年度の履修データを取得
  const getEnrolledCoursesForSemester = (
    year: number,
    _semester: "spring" | "fall",
  ): UserCourseRecord[] => {
    if (!props.enrollment) return [];
    return props.enrollment.courses.filter((c) => c.year === year);
  };

  // 科目を追加
  const handleAddCourse = async (
    year: number,
    semester: "spring" | "fall",
    course: PlannedCourse,
  ) => {
    await addCourseToSemester(props.profileId, year, semester, course);
    const updated = await getCoursePlan(props.profileId);
    setPlan(updated || null);
  };

  // 科目を削除
  const handleRemoveCourse = async (
    year: number,
    semester: "spring" | "fall",
    courseId: string,
  ) => {
    await removeCourseFromSemester(props.profileId, year, semester, courseId);
    const updated = await getCoursePlan(props.profileId);
    setPlan(updated || null);
  };

  // 科目を更新
  const handleUpdateCourse = async (
    year: number,
    semester: "spring" | "fall",
    courseId: string,
    updates: Partial<PlannedCourse>,
  ) => {
    await updateCourseInPlan(props.profileId, year, semester, courseId, updates);
    const updated = await getCoursePlan(props.profileId);
    setPlan(updated || null);
  };

  // kdbデータを更新
  const handleRefreshKdb = async () => {
    setIsRefreshingKdb(true);
    try {
      await refreshKdbCache();
    } catch (error) {
      console.error("Failed to refresh kdb:", error);
    } finally {
      setIsRefreshingKdb(false);
    }
  };

  // 年度選択肢
  const yearOptions = () => {
    const years: number[] = [];
    for (let i = 0; i < 4; i++) {
      years.push(props.enrollmentYear + i);
    }
    return years;
  };

  return (
    <div class="space-y-6">
      {/* ヘッダー */}
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-2">
          <For each={yearOptions()}>
            {(year) => (
              <Button
                variant={selectedYear() === year ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedYear(year)}
              >
                {year}年度
              </Button>
            )}
          </For>
        </div>

        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshKdb}
            disabled={isRefreshingKdb()}
          >
            {isRefreshingKdb() ? "更新中..." : "kdb更新"}
          </Button>
          <Button variant="outline" size="sm" onClick={props.onSyncTwins}>
            TWINSデータを同期
          </Button>
        </div>
      </div>

      {/* 学期ビュー */}
      <Show when={!isLoading()} fallback={<div>読み込み中...</div>}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <For each={yearSemesters()}>
            {(semester) => (
              <SemesterView
                plan={semester}
                enrolledCourses={getEnrolledCoursesForSemester(semester.year, semester.semester)}
                onAddCourse={(course) => handleAddCourse(semester.year, semester.semester, course)}
                onRemoveCourse={(courseId) =>
                  handleRemoveCourse(semester.year, semester.semester, courseId)
                }
                onUpdateCourse={(courseId, updates) =>
                  handleUpdateCourse(semester.year, semester.semester, courseId, updates)
                }
              />
            )}
          </For>
        </div>
      </Show>

      {/* 全体サマリー */}
      <Show when={plan()}>
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">4年間の履修状況</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-4 gap-4 text-center">
              <For each={yearOptions()}>
                {(year) => {
                  const yearPlans = () => plan()?.plans.filter((p) => p.year === year) ?? [];
                  const totalCredits = () =>
                    yearPlans().reduce(
                      (sum, p) => sum + p.courses.reduce((s, c) => s + c.credits, 0),
                      0,
                    );
                  const enrolled = () =>
                    props.enrollment?.courses.filter((c) => c.year === year) || [];
                  const earnedCredits = () =>
                    enrolled()
                      .filter((c) => c.isPassed)
                      .reduce((sum, c) => sum + c.credits, 0);

                  return (
                    <div class="p-3 border rounded-lg">
                      <div class="text-sm text-muted-foreground">{year}年度</div>
                      <div class="text-lg font-bold mt-1">
                        {earnedCredits() > 0 ? earnedCredits() : totalCredits()}
                        <span class="text-sm font-normal text-muted-foreground">単位</span>
                      </div>
                      <div class="text-xs text-muted-foreground mt-1">
                        {earnedCredits() > 0 ? "取得済み" : totalCredits() > 0 ? "計画" : "未設定"}
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </CardContent>
        </Card>
      </Show>
    </div>
  );
};
