import { type Accessor, type Component, Index, type Setter } from "solid-js";
import { Label } from "~/components/ui/label";
import { normalizeCourseIds } from "../utils/courseGroup";
import { CourseIdRow } from "./CourseIdRow";

interface RequiredCoursesEditorProps {
  courseIds: Accessor<string[]>;
  setCourseIds: Setter<string[]>;
}

export const RequiredCoursesEditor: Component<RequiredCoursesEditorProps> = (props) => {
  const handleUpdateCourseId = (index: number, value: string) => {
    props.setCourseIds((prev) =>
      normalizeCourseIds(prev.map((id, i) => (i === index ? value : id))),
    );
  };

  const handleRemoveCourseId = (index: number) => {
    props.setCourseIds((prev) => normalizeCourseIds(prev.filter((_, i) => i !== index)));
  };

  return (
    <div class="space-y-2">
      <Label>科目番号（カンマ区切り）</Label>
      <div class="space-y-2">
        <Index each={props.courseIds()}>
          {(id, index) => (
            <CourseIdRow
              id={id}
              index={index}
              totalCount={props.courseIds().length}
              onUpdateCourseId={handleUpdateCourseId}
              onRemoveCourseId={handleRemoveCourseId}
            />
          )}
        </Index>
      </div>
    </div>
  );
};
