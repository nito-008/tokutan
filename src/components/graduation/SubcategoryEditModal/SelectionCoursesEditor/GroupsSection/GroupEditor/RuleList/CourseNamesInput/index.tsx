import { type Component, createEffect, createSignal } from "solid-js";
import { Input } from "~/components/ui/input";
import { Popover, PopoverAnchor } from "~/components/ui/popover";
import type { Course } from "~/types";
import { CourseSuggestionDropdown } from "../../../../../RequiredCoursesEditor/CourseIdRow/CourseSuggestion";
import { useSuggestionSearch } from "../../../../../RequiredCoursesEditor/CourseIdRow/CourseSuggestion/useSuggestionSearch";
import {
  dropSearchToken,
  extractSuggestionToken,
  formatCourseGroup,
  normalizeCourseGroup,
  parseCourseGroup,
  uniqueCourseIds,
} from "../../../../../utils/courseGroup";

interface CourseNamesInputProps {
  courseNames: string[];
  onUpdate: (courseNames: string[]) => void;
}

export const CourseNamesInput: Component<CourseNamesInputProps> = (props) => {
  const [localValue, setLocalValue] = createSignal(formatCourseGroup(props.courseNames));
  const [isFocused, setIsFocused] = createSignal(false);
  const [hasActiveSearch, setHasActiveSearch] = createSignal(false);
  const suggestionSearch = useSuggestionSearch(isFocused);

  const groupValues = () => uniqueCourseIds(parseCourseGroup(localValue()));
  const selectedNames = () => new Set(groupValues());

  createEffect(() => {
    if (!isFocused()) {
      setLocalValue(formatCourseGroup(props.courseNames));
    }
  });

  const handleInputChange = (value: string) => {
    setLocalValue(value);
    setHasActiveSearch(true);
    suggestionSearch.search(extractSuggestionToken(value));
  };

  const handleFocus = (value: string) => {
    setIsFocused(true);
    suggestionSearch.search(extractSuggestionToken(value));
  };

  const handleBlur = () => {
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
    const baseValues = hasActiveSearch()
      ? dropSearchToken(currentValue)
      : parseCourseGroup(currentValue);
    const currentNames = uniqueCourseIds(baseValues);
    const nextNames = currentNames.includes(course.name)
      ? currentNames.filter((name) => name !== course.name)
      : [...currentNames, course.name];
    const newValue = formatCourseGroup(nextNames);
    setLocalValue(newValue);
    props.onUpdate(nextNames);
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
                  value={localValue()}
                  onInput={(e) => handleInputChange(e.currentTarget.value)}
                  onFocus={(e) => handleFocus(e.currentTarget.value)}
                  onBlur={() => handleBlur()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setIsFocused(false);
                      suggestionSearch.clear();
                      blurTarget?.focus();
                    }
                  }}
                  placeholder="科目名を入力（複数はカンマ区切り）"
                />
                <div ref={setBlurTarget} tabIndex={-1} class="sr-only" aria-hidden="true" />
              </div>
            </PopoverAnchor>
            <CourseSuggestionDropdown
              isVisible={isFocused}
              suggestions={suggestionSearch.suggestions}
              isLoading={suggestionSearch.isLoading}
              query={suggestionSearch.query}
              selectedIds={selectedNames}
              onSelect={toggleSuggestionSelect}
            />
          </Popover>
        );
      })()}
    </div>
  );
};
