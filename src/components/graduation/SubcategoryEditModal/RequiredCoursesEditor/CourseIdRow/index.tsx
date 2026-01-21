import { Check, Trash2 } from "lucide-solid";
import { type Accessor, type Component, For, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { Course } from "~/lib/types";
import { formatCourseGroupLabel, parseCourseGroup, uniqueCourseIds } from "../../utils/courseGroup";

interface CourseIdRowProps {
  id: Accessor<string>;
  index: number;
  totalCount: number;
  focusedCourseIndex: Accessor<number | null>;
  setFocusedCourseIndex: (index: number | null) => void;
  requiredCourseNames: Accessor<Map<string, string>>;
  isCourseLookupLoading: Accessor<boolean>;
  courseSuggestions: Accessor<Course[]>;
  isSuggestionLoading: Accessor<boolean>;
  suggestionIndex: Accessor<number | null>;
  suggestionQuery: Accessor<string>;
  onInputChange: (index: number, value: string) => void;
  onFocusInput: (index: number, value: string) => void;
  onBlurInput: (index: number, value: string) => void;
  onToggleSuggestion: (index: number, course: Course) => void;
  onRemove: (index: number) => void;
  clearSuggestions: () => void;
}

export const CourseIdRow: Component<CourseIdRowProps> = (props) => {
  const isPlaceholderRow = () => props.index === props.totalCount - 1;
  const isFocused = () => props.focusedCourseIndex() === props.index;
  const groupIds = () => uniqueCourseIds(parseCourseGroup(props.id()));
  const selectedIds = () => new Set(groupIds());
  const isMissingCourse = () =>
    groupIds().length > 0 &&
    !isFocused() &&
    !isPlaceholderRow() &&
    !props.isCourseLookupLoading() &&
    groupIds().some((courseId) => !props.requiredCourseNames().has(courseId));

  return (
    <div class="flex items-start gap-2">
      <div class="flex-1 space-y-1">
        {(() => {
          let blurTarget: HTMLDivElement | undefined;
          const setBlurTarget = (el: HTMLDivElement) => {
            blurTarget = el;
          };
          return (
            <div class="relative">
              <Input
                classList={{
                  "text-transparent caret-foreground": !isFocused(),
                  "border-destructive focus-visible:ring-destructive": isMissingCourse(),
                }}
                value={props.id()}
                onInput={(e) => props.onInputChange(props.index, e.currentTarget.value)}
                onFocus={() => props.onFocusInput(props.index, props.id())}
                onBlur={() => props.onBlurInput(props.index, props.id())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    props.setFocusedCourseIndex(null);
                    props.clearSuggestions();
                    blurTarget?.focus();
                  }
                }}
                placeholder={isPlaceholderRow() ? "科目番号を追加" : "例: FG20204"}
              />
              <Show when={groupIds().length > 0 && !isFocused()}>
                <div
                  class={`pointer-events-none absolute inset-y-0 left-3 right-3 flex items-center text-sm truncate ${
                    isMissingCourse() ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {isMissingCourse()
                    ? `${props.id()}（科目が見つかりません）`
                    : formatCourseGroupLabel(
                        props.id(),
                        props.requiredCourseNames(),
                        props.isCourseLookupLoading(),
                      )}
                </div>
              </Show>
              <div ref={setBlurTarget} tabIndex={-1} class="sr-only" aria-hidden="true" />
              <Show
                when={
                  isFocused() &&
                  props.suggestionIndex() === props.index &&
                  (props.isSuggestionLoading() ||
                    props.courseSuggestions().length > 0 ||
                    props.suggestionQuery().length >= 2)
                }
              >
                <div class="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border bg-background shadow">
                  <Show when={props.isSuggestionLoading()}>
                    <div class="px-3 py-2 text-xs text-muted-foreground">検索中...</div>
                  </Show>
                  <Show when={!props.isSuggestionLoading() && props.courseSuggestions().length > 0}>
                    <div class="divide-y">
                      <For each={props.courseSuggestions()}>
                        {(course) => (
                          <button
                            type="button"
                            class="w-full px-3 py-2 text-left hover:bg-muted"
                            classList={{
                              "bg-muted": selectedIds().has(course.id),
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              props.onToggleSuggestion(props.index, course);
                            }}
                          >
                            <div class="flex items-center justify-between">
                              <span class="text-sm font-medium">{course.name}</span>
                              <span class="text-xs text-muted-foreground">
                                <Show when={selectedIds().has(course.id)}>
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
                    when={
                      !props.isSuggestionLoading() &&
                      props.suggestionQuery().length >= 2 &&
                      props.courseSuggestions().length === 0
                    }
                  >
                    <div class="px-3 py-2 text-xs text-muted-foreground">
                      該当する科目が見つかりません
                    </div>
                  </Show>
                </div>
              </Show>
            </div>
          );
        })()}
      </div>
      <Show when={!isPlaceholderRow()}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="mt-1 text-muted-foreground hover:text-foreground"
          onClick={() => props.onRemove(props.index)}
        >
          <Trash2 class="size-4" />
        </Button>
      </Show>
    </div>
  );
};
