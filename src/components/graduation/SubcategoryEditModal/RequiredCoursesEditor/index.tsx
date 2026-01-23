import {
  closestCenter,
  DragDropProvider,
  DragDropSensors,
  type DragEvent,
  SortableProvider,
} from "@thisbeyond/solid-dnd";
import { type Accessor, type Component, Index, type Setter } from "solid-js";
import { Label } from "~/components/ui/label";
import { normalizeCourseIds } from "../utils/courseGroup";
import { CourseIdRow } from "./CourseIdRow";

interface RequiredCoursesEditorProps {
  courseIds: Accessor<string[]>;
  setCourseIds: Setter<string[]>;
}

export const RequiredCoursesEditor: Component<RequiredCoursesEditorProps> = (props) => {
  // ソート対象のID（プレースホルダー除外）
  const sortableIds = () => {
    const ids = props.courseIds();
    return ids.length > 1 ? ids.slice(0, -1).map((_, i) => String(i)) : [];
  };

  // ドラッグ終了時の並べ替え処理
  const handleDragEnd = (event: DragEvent) => {
    const { draggable, droppable } = event;
    if (!draggable || !droppable) return;
    const fromIndex = Number(draggable.id);
    const toIndex = Number(droppable.id);
    if (fromIndex !== toIndex) {
      props.setCourseIds((prev) => {
        const items = [...prev];
        const sortable = items.slice(0, -1);
        const [moved] = sortable.splice(fromIndex, 1);
        sortable.splice(toIndex, 0, moved);
        return [...sortable, ""];
      });
    }
  };

  const handleUpdateCourseId = (index: number, value: string) => {
    props.setCourseIds((prev) => prev.map((id, i) => (i === index ? value : id)));
  };

  const handleFinishEditing = () => {
    props.setCourseIds((prev) => normalizeCourseIds(prev));
  };

  const handleRemoveCourseId = (index: number) => {
    props.setCourseIds((prev) => normalizeCourseIds(prev.filter((_, i) => i !== index)));
  };

  return (
    <div class="space-y-2">
      <Label>科目番号（カンマ区切り）</Label>
      <DragDropProvider collisionDetector={closestCenter} onDragEnd={handleDragEnd}>
        <DragDropSensors />
        <SortableProvider ids={sortableIds()}>
          <div class="space-y-2">
            <Index each={props.courseIds()}>
              {(id, index) => (
                <CourseIdRow
                  id={id}
                  index={index}
                  totalCount={props.courseIds().length}
                  onUpdateCourseId={handleUpdateCourseId}
                  onRemoveCourseId={handleRemoveCourseId}
                  onFinishEditing={handleFinishEditing}
                />
              )}
            </Index>
          </div>
        </SortableProvider>
      </DragDropProvider>
    </div>
  );
};
