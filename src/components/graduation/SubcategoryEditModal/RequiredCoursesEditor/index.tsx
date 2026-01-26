import {
  closestCenter,
  DragDropProvider,
  DragDropSensors,
  type DragEvent,
  SortableProvider,
} from "@thisbeyond/solid-dnd";
import { type Accessor, type Component, For, type Setter, Show } from "solid-js";
import { Label } from "~/components/ui/label";
import { normalizeCourseIds } from "../utils/courseGroup";
import { CourseIdRowContent } from "./CourseIdRow/CourseIdRowContent";
import { SortableCourseIdRow } from "./CourseIdRow/SortableCourseIdRow";

interface RequiredCoursesEditorProps {
  courseIds: Accessor<string[]>;
  setCourseIds: Setter<string[]>;
}

export const RequiredCoursesEditor: Component<RequiredCoursesEditorProps> = (props) => {
  // ソート対象のID（プレースホルダー除外）
  const sortableIds = () => {
    const ids = props.courseIds();
    return ids.length > 1 ? ids.slice(0, -1) : [];
  };

  // ドラッグ終了時の並べ替え処理
  const handleDragEnd = (event: DragEvent) => {
    const { draggable, droppable } = event;
    if (!draggable || !droppable) return;
    const ids = props.courseIds();
    const fromIndex = ids.findIndex((id) => id === String(draggable.id));
    const toIndex = ids.findIndex((id) => id === String(droppable.id));
    if (fromIndex < 0 || toIndex < 0) return;
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
      <DragDropProvider collisionDetector={closestCenter} onDragEnd={handleDragEnd}>
        <DragDropSensors />
        <SortableProvider ids={sortableIds()}>
          <div class="space-y-2">
            <For each={props.courseIds()}>
              {(id, index) => {
                const isPlaceholder = () => index() === props.courseIds().length - 1;
                return (
                  <Show
                    when={!isPlaceholder()}
                    fallback={
                      <CourseIdRowContent
                        id={id}
                        index={index()}
                        isPlaceholder={true}
                        onUpdateCourseId={handleUpdateCourseId}
                        onRemoveCourseId={handleRemoveCourseId}
                      />
                    }
                  >
                    <SortableCourseIdRow
                      id={id}
                      index={index()}
                      sortableCount={sortableIds().length}
                      onUpdateCourseId={handleUpdateCourseId}
                      onRemoveCourseId={handleRemoveCourseId}
                    />
                  </Show>
                );
              }}
            </For>
          </div>
        </SortableProvider>
      </DragDropProvider>
    </div>
  );
};
