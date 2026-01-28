import { type Component, createSignal, For, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { PlannedCourse, SemesterPlan, UserCourseRecord } from "~/types";
import { CourseCard } from "./CourseCard";
import { CourseSearchDialog } from "./CourseSearchDialog";

interface SemesterViewProps {
  plan: SemesterPlan;
  enrolledCourses: UserCourseRecord[];
  onAddCourse: (course: PlannedCourse) => void;
  onRemoveCourse: (courseId: string) => void;
  onUpdateCourse: (courseId: string, updates: Partial<PlannedCourse>) => void;
}

export const SemesterView: Component<SemesterViewProps> = (props) => {
  const [showSearch, setShowSearch] = createSignal(false);

  // 履修計画と実際の履修データをマージ
  const allCourses = () => {
    const plannedIds = new Set(props.plan.courses.map((c) => c.courseId));
    const enrolled = props.enrolledCourses.filter((c) => !plannedIds.has(c.courseId));

    // 実際の履修データを PlannedCourse 形式に変換
    const enrolledAsPlanned: PlannedCourse[] = enrolled.map((c) => ({
      courseId: c.courseId,
      courseName: c.courseName,
      credits: c.credits,
      status: c.isPassed
        ? ("completed" as const)
        : c.isInProgress
          ? ("enrolled" as const)
          : c.grade === "D"
            ? ("failed" as const)
            : ("planned" as const),
      actualGrade: c.grade,
    }));

    return [...props.plan.courses, ...enrolledAsPlanned];
  };

  // 単位数を計算
  const totalCredits = () => allCourses().reduce((sum, c) => sum + c.credits, 0);
  const earnedCredits = () =>
    allCourses()
      .filter((c) => c.status === "completed")
      .reduce((sum, c) => sum + c.credits, 0);

  const semesterLabel = () => (props.plan.semester === "spring" ? "春学期" : "秋学期");

  const statusSummary = () => {
    const courses = allCourses();
    const completed = courses.filter((c) => c.status === "completed").length;
    const enrolled = courses.filter((c) => c.status === "enrolled").length;
    const planned = courses.filter((c) => c.status === "planned").length;

    if (enrolled > 0) return `履修中: ${totalCredits()}単位`;
    if (completed > 0 && planned === 0) return `取得: ${earnedCredits()}単位`;
    if (planned > 0) return `計画: ${totalCredits()}単位`;
    return "科目なし";
  };

  const handleAddCourse = (course: PlannedCourse) => {
    props.onAddCourse(course);
    setShowSearch(false);
  };

  return (
    <Card>
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base">
            {props.plan.year}年度 {semesterLabel()}
          </CardTitle>
          <span class="text-sm text-muted-foreground">{statusSummary()}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <For each={allCourses()}>
            {(course) => (
              <CourseCard
                course={course}
                onRemove={() => props.onRemoveCourse(course.courseId)}
                onUpdate={(updates) => props.onUpdateCourse(course.courseId, updates)}
              />
            )}
          </For>

          <Show when={allCourses().length === 0}>
            <p class="text-sm text-muted-foreground text-center py-4">科目がありません</p>
          </Show>

          <Button variant="outline" size="sm" class="w-full" onClick={() => setShowSearch(true)}>
            + 科目を追加
          </Button>
        </div>

        <CourseSearchDialog
          open={showSearch()}
          onClose={() => setShowSearch(false)}
          onSelect={handleAddCourse}
        />
      </CardContent>
    </Card>
  );
};
