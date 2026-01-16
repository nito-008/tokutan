import { type Component, Show } from "solid-js";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { PlannedCourse } from "~/lib/types";

interface CourseCardProps {
  course: PlannedCourse;
  onRemove: () => void;
  onUpdate: (updates: Partial<PlannedCourse>) => void;
}

export const CourseCard: Component<CourseCardProps> = (props) => {
  const statusStyles = {
    planned: "bg-gray-100 border-gray-200",
    enrolled: "bg-blue-50 border-blue-200",
    completed: "bg-green-50 border-green-200",
    failed: "bg-red-50 border-red-200",
  };

  const gradeColors: Record<string, string> = {
    "A+": "bg-green-500",
    A: "bg-lime-500",
    B: "bg-yellow-500",
    C: "bg-orange-500",
    D: "bg-red-500",
    P: "bg-purple-500",
    認: "bg-purple-500",
    履修中: "bg-blue-500",
  };

  const statusLabels = {
    planned: "計画",
    enrolled: "履修中",
    completed: "修了",
    failed: "不可",
  };

  return (
    <div
      class={`
      flex items-center gap-3 p-3 rounded-lg border
      ${statusStyles[props.course.status]}
    `}
    >
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="font-medium text-sm truncate">{props.course.courseName}</span>
          <span class="text-xs text-muted-foreground">({props.course.credits}単位)</span>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs text-muted-foreground">{props.course.courseId}</span>
          <Badge variant="outline" class="text-xs">
            {statusLabels[props.course.status]}
          </Badge>
          <Show when={props.course.actualGrade && props.course.actualGrade !== "-"}>
            <Badge
              class={`${gradeColors[props.course.actualGrade!] || "bg-gray-500"} text-white text-xs`}
            >
              {props.course.actualGrade}
            </Badge>
          </Show>
        </div>
      </div>

      <Show when={props.course.status === "planned"}>
        <Button variant="ghost" size="sm" class="h-8 w-8 p-0" onClick={props.onRemove}>
          ×
        </Button>
      </Show>
    </div>
  );
};
