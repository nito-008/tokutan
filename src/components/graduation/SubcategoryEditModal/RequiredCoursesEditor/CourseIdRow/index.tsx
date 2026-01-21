import { Check, Trash2 } from "lucide-solid";
import {
  type Accessor,
  type Component,
  createEffect,
  createSignal,
  For,
  onCleanup,
  Show,
} from "solid-js";
import { toast } from "solid-sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { getCoursesByIds, searchKdb } from "~/lib/db/kdb";
import type { Course } from "~/lib/types";
import {
  dropSearchToken,
  extractSuggestionToken,
  formatCourseGroup,
  formatCourseGroupLabel,
  getGroupName,
  normalizeCourseGroup,
  parseCourseGroup,
  uniqueCourseIds,
} from "../../utils/courseGroup";

interface CourseIdRowProps {
  id: Accessor<string>;
  index: number;
  totalCount: number;
  onUpdateCourseId: (index: number, value: string) => void;
  onRemoveCourseId: (index: number) => void;
}

export const CourseIdRow: Component<CourseIdRowProps> = (props) => {
  const [requiredCourseNames, setRequiredCourseNames] = createSignal<Map<string, string>>(
    new Map(),
  );
  const [isCourseLookupLoading, setIsCourseLookupLoading] = createSignal(false);
  const [isFocused, setIsFocused] = createSignal(false);
  const [courseSuggestions, setCourseSuggestions] = createSignal<Course[]>([]);
  const [isSuggestionLoading, setIsSuggestionLoading] = createSignal(false);
  const [suggestionQuery, setSuggestionQuery] = createSignal("");
  const [hasActiveSearch, setHasActiveSearch] = createSignal(false);
  let suggestionTimeout: number | null = null;
  let suggestionRequestId = 0;

  const isPlaceholderRow = () => props.index === props.totalCount - 1;
  const groupIds = () => uniqueCourseIds(parseCourseGroup(props.id()));
  const selectedIds = () => new Set(groupIds());
  const isMissingCourse = () =>
    groupIds().length > 0 &&
    !isFocused() &&
    !isPlaceholderRow() &&
    !isCourseLookupLoading() &&
    groupIds().some((courseId) => !requiredCourseNames().has(courseId));

  const resetSuggestionQuery = () => {
    if (suggestionTimeout) {
      clearTimeout(suggestionTimeout);
      suggestionTimeout = null;
    }
    suggestionRequestId += 1;
    setIsSuggestionLoading(false);
    setSuggestionQuery("");
  };

  const clearSuggestions = () => {
    resetSuggestionQuery();
    setCourseSuggestions([]);
    setHasActiveSearch(false);
  };

  const requestSuggestions = (value: string) => {
    const normalizedValue = value.trim();
    if (suggestionTimeout) {
      clearTimeout(suggestionTimeout);
      suggestionTimeout = null;
    }
    setSuggestionQuery(normalizedValue);
    if (normalizedValue.length < 2) {
      setCourseSuggestions([]);
      setIsSuggestionLoading(false);
      return;
    }
    const requestId = ++suggestionRequestId;
    suggestionTimeout = window.setTimeout(async () => {
      setIsSuggestionLoading(true);
      try {
        const found = await searchKdb(normalizedValue);
        if (requestId !== suggestionRequestId) return;
        if (!isFocused()) return;
        setCourseSuggestions(found);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        if (requestId === suggestionRequestId) {
          setIsSuggestionLoading(false);
        }
      }
    }, 250);
  };

  onCleanup(() => {
    if (suggestionTimeout) {
      clearTimeout(suggestionTimeout);
    }
    suggestionRequestId += 1;
  });

  createEffect(() => {
    const ids = groupIds();
    if (ids.length === 0) {
      setRequiredCourseNames(new Map());
      setIsCourseLookupLoading(false);
      return;
    }

    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    void (async () => {
      setIsCourseLookupLoading(true);
      const courses = await getCoursesByIds(ids);
      if (cancelled) return;
      const nameMap = new Map<string, string>();
      for (const course of courses) {
        nameMap.set(course.id, course.name);
      }
      setRequiredCourseNames(nameMap);
      setIsCourseLookupLoading(false);
    })();
  });

  const handleInputChange = (value: string) => {
    setHasActiveSearch(true);
    props.onUpdateCourseId(props.index, value);
    requestSuggestions(extractSuggestionToken(value));
  };

  const handleFocusInput = (value: string) => {
    setIsFocused(true);
    requestSuggestions(extractSuggestionToken(value));
  };

  const handleBlurInput = (value: string) => {
    if (isFocused()) {
      setIsFocused(false);
      clearSuggestions();
    }
    setHasActiveSearch(false);
    props.onUpdateCourseId(props.index, normalizeCourseGroup(value));
  };

  const toggleSuggestionSelect = (course: Course) => {
    const currentValue = props.id() ?? "";
    const baseIds = hasActiveSearch()
      ? dropSearchToken(currentValue)
      : parseCourseGroup(currentValue);
    const currentIds = uniqueCourseIds(baseIds);
    const currentName = getGroupName(currentIds, requiredCourseNames());
    if (currentName && currentName !== course.name) {
      toast.error("既存の科目名と一致しないため追加できません");
      return;
    }
    const nextIds = currentIds.includes(course.id)
      ? currentIds.filter((id) => id !== course.id)
      : [...currentIds, course.id];
    setRequiredCourseNames((prev) => {
      const next = new Map(prev);
      next.set(course.id, course.name);
      return next;
    });
    props.onUpdateCourseId(props.index, formatCourseGroup(nextIds));
    resetSuggestionQuery();
    setHasActiveSearch(false);
  };

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
                onInput={(e) => handleInputChange(e.currentTarget.value)}
                onFocus={(e) => handleFocusInput(e.currentTarget.value)}
                onBlur={(e) => handleBlurInput(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setIsFocused(false);
                    clearSuggestions();
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
                        requiredCourseNames(),
                        isCourseLookupLoading(),
                      )}
                </div>
              </Show>
              <div ref={setBlurTarget} tabIndex={-1} class="sr-only" aria-hidden="true" />
              <Show
                when={
                  isFocused() &&
                  (isSuggestionLoading() ||
                    courseSuggestions().length > 0 ||
                    suggestionQuery().length >= 2)
                }
              >
                <div class="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border bg-background shadow">
                  <Show when={isSuggestionLoading()}>
                    <div class="px-3 py-2 text-xs text-muted-foreground">検索中...</div>
                  </Show>
                  <Show when={!isSuggestionLoading() && courseSuggestions().length > 0}>
                    <div class="divide-y">
                      <For each={courseSuggestions()}>
                        {(course) => (
                          <button
                            type="button"
                            class="w-full px-3 py-2 text-left hover:bg-muted"
                            classList={{
                              "bg-muted": selectedIds().has(course.id),
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              toggleSuggestionSelect(course);
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
                      !isSuggestionLoading() &&
                      suggestionQuery().length >= 2 &&
                      courseSuggestions().length === 0
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
          onClick={() => props.onRemoveCourseId(props.index)}
        >
          <Trash2 class="size-4" />
        </Button>
      </Show>
    </div>
  );
};
