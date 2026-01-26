import { createSortable } from "@thisbeyond/solid-dnd";
import type { Accessor, Component } from "solid-js";
import { CourseIdRowContent } from "../CourseIdRowContent";

interface SortableCourseIdRowProps {
  id: Accessor<string>;
  index: number;
  sortableCount: number;
  onUpdateCourseId: (index: number, value: string) => void;
  onRemoveCourseId: (index: number) => void;
}

export const SortableCourseIdRow: Component<SortableCourseIdRowProps> = (props) => {
  const sortable = createSortable(String(props.index));

  return (
    <CourseIdRowContent
      id={props.id}
      index={props.index}
      isPlaceholder={false}
      onUpdateCourseId={props.onUpdateCourseId}
      onRemoveCourseId={props.onRemoveCourseId}
      sortableRef={sortable.ref}
      sortableTransform={sortable.transform}
      isActiveDraggable={sortable.isActiveDraggable}
      dragActivators={sortable.dragActivators}
      sortableCount={props.sortableCount}
    />
  );
};
