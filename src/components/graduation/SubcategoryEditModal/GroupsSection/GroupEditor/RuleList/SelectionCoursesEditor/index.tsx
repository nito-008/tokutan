import { type Component, createEffect, createSignal, Show } from "solid-js";
import { Input } from "~/components/ui/input";
import { Popover, PopoverAnchor } from "~/components/ui/popover";
import { getCoursesByIds } from "~/lib/db/kdb";
import type { Course } from "~/lib/types";
import { CourseSuggestionDropdown } from "../../../../RequiredCoursesEditor/CourseIdRow/CourseSuggestion";
import { useSuggestionSearch } from "../../../../RequiredCoursesEditor/CourseIdRow/CourseSuggestion/useSuggestionSearch";
import {
  dropSearchToken,
  extractSuggestionToken,
  formatCourseGroup,
  formatCourseGroupLabel,
  normalizeCourseGroup,
  parseCourseGroup,
  uniqueCourseIds,
} from "../../../../utils/courseGroup";

interface SelectionCoursesEditorProps {
  courseIds: string[];
  onUpdate: (courseIds: string[]) => void;
}

export const SelectionCoursesEditor: Component<SelectionCoursesEditorProps> = (props) => {
  const [courseNames, setCourseNames] = createSignal<Map<string, string>>(new Map());
  const [isCourseLookupLoading, setIsCourseLookupLoading] = createSignal(false);
  const [isFocused, setIsFocused] = createSignal(false);
  const [hasActiveSearch, setHasActiveSearch] = createSignal(false);
  const [localValue, setLocalValue] = createSignal(formatCourseGroup(props.courseIds));

  createEffect(() => {
    if (!isFocused()) {
      setLocalValue(formatCourseGroup(props.courseIds));
    }
  });

  const suggestionSearch = useSuggestionSearch(isFocused);
  const groupIds = () => uniqueCourseIds(parseCourseGroup(localValue()));
  const selectedIds = () => new Set(groupIds());

  const getRelatedCourseId = (value: string) => {
    if (!value.includes(",")) {
      const trimmed = value.trim();
      return trimmed || undefined;
    }
    const [firstToken] = value.split(",");
    const trimmed = firstToken?.trim();
    return trimmed || undefined;
  };

  const isMissingCourse = () =>
    groupIds().length > 0 &&
    !isFocused() &&
    !isCourseLookupLoading() &&
    groupIds().some((courseId) => !courseNames().has(courseId));

  createEffect(() => {
    const ids = groupIds();
    if (ids.length === 0) {
      setCourseNames(new Map());
      setIsCourseLookupLoading(false);
      return;
    }

    let cancelled = false;
    const cancel = () => {
      cancelled = true;
    };

    void (async () => {
      setIsCourseLookupLoading(true);
      const courses = await getCoursesByIds(ids);
      if (cancelled) return;
      const nameMap = new Map<string, string>();
      for (const course of courses) {
        nameMap.set(course.id, course.name);
      }
      setCourseNames(nameMap);
      setIsCourseLookupLoading(false);
    })();

    return cancel;
  });

  const handleInputChange = (value: string) => {
    setLocalValue(value);
    setHasActiveSearch(true);
    suggestionSearch.search(extractSuggestionToken(value), getRelatedCourseId(value));
  };

  const handleFocusInput = (value: string) => {
    setIsFocused(true);
    suggestionSearch.search(extractSuggestionToken(value), getRelatedCourseId(value));
  };

  const handleBlurInput = () => {
    if (isFocused()) {
      setIsFocused(false);
      suggestionSearch.clear();
    }
    setHasActiveSearch(false);
    const normalized = normalizeCourseGroup(localValue());
    setLocalValue(normalized);
    props.onUpdate(parseCourseGroup(normalized));
  };

  const toggleSuggestionSelect = (course: Course) => {
    const currentValue = localValue() ?? "";
    const baseIds = hasActiveSearch()
      ? dropSearchToken(currentValue)
      : parseCourseGroup(currentValue);
    const currentIds = uniqueCourseIds(baseIds);
    const nextIds = currentIds.includes(course.id)
      ? currentIds.filter((id) => id !== course.id)
      : [...currentIds, course.id];
    setCourseNames((prev) => {
      const next = new Map(prev);
      next.set(course.id, course.name);
      return next;
    });
    const newValue = formatCourseGroup(nextIds);
    setLocalValue(newValue);
    props.onUpdate(nextIds);
    suggestionSearch.resetQuery();
    setHasActiveSearch(false);
  };

  return (
    <div class="space-y-1">
      {(() => {
        let blurTarget: HTMLDivElement | undefined;
        const setBlurTarget = (el: HTMLDivElement) => {
          blurTarget = el;
        };
        return (
          <Popover
            open={
              isFocused() &&
              (suggestionSearch.isLoading() ||
                suggestionSearch.suggestions().length > 0 ||
                suggestionSearch.query().length >= 2)
            }
          >
            <PopoverAnchor>
              <div class="relative">
                <Input
                  class="h-8"
                  classList={{
                    "text-transparent caret-foreground": !isFocused(),
                    "border-destructive focus-visible:ring-destructive": isMissingCourse(),
                  }}
                  value={localValue()}
                  onInput={(e) => handleInputChange(e.currentTarget.value)}
                  onFocus={(e) => handleFocusInput(e.currentTarget.value)}
                  onBlur={() => handleBlurInput()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setIsFocused(false);
                      suggestionSearch.clear();
                      blurTarget?.focus();
                    }
                  }}
                  placeholder="科目番号（カンマ区切り）"
                />
                <Show when={groupIds().length > 0 && !isFocused()}>
                  <div
                    class={`pointer-events-none absolute inset-y-0 left-3 right-3 flex items-center text-sm truncate ${
                      isMissingCourse() ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {formatCourseGroupLabel(localValue(), courseNames(), isCourseLookupLoading())}
                  </div>
                </Show>
                <div ref={setBlurTarget} tabIndex={-1} class="sr-only" aria-hidden="true" />
              </div>
            </PopoverAnchor>
            <CourseSuggestionDropdown
              isVisible={isFocused}
              suggestions={suggestionSearch.suggestions}
              isLoading={suggestionSearch.isLoading}
              query={suggestionSearch.query}
              selectedIds={selectedIds}
              onSelect={toggleSuggestionSelect}
            />
          </Popover>
        );
      })()}
    </div>
  );
};
