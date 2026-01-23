import { Check } from "lucide-solid";
import { type Accessor, type Component, For, Show } from "solid-js";
import { PopoverContent } from "~/components/ui/popover";
import type { Course } from "~/lib/types";

interface CourseSuggestionDropdownProps {
  isVisible: Accessor<boolean>;
  suggestions: Accessor<Course[]>;
  isLoading: Accessor<boolean>;
  query: Accessor<string>;
  selectedIds: Accessor<Set<string>>;
  onSelect: (course: Course) => void;
}

export const CourseSuggestionDropdown: Component<CourseSuggestionDropdownProps> = (props) => {
  return (
    <PopoverContent
      class="max-h-56 w-full overflow-y-auto p-0"
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <Show when={props.isLoading()}>
        <div class="px-3 py-2 text-xs text-muted-foreground">検索中...</div>
      </Show>
      <Show when={!props.isLoading() && props.suggestions().length > 0}>
        <div class="divide-y">
          <For each={props.suggestions()}>
            {(course) => (
              <button
                type="button"
                class="w-full px-3 py-2 text-left hover:bg-muted"
                classList={{
                  "bg-muted": props.selectedIds().has(course.id),
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  props.onSelect(course);
                }}
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">{course.name}</span>
                  <span class="text-xs text-muted-foreground">
                    <Show when={props.selectedIds().has(course.id)}>
                      <Check class="mr-1 inline-block size-4 text-primary" />
                    </Show>
                    {course.credits}単位
                  </span>
                </div>
                <div class="text-xs text-muted-foreground">
                  {course.id} / {course.semester} {course.schedule}
                </div>
              </button>
            )}
          </For>
        </div>
      </Show>
      <Show
        when={!props.isLoading() && props.query().length >= 2 && props.suggestions().length === 0}
      >
        <div class="px-3 py-2 text-xs text-muted-foreground">該当する科目が見つかりません</div>
      </Show>
    </PopoverContent>
  );
};
