import { type Component, createSignal, For } from "solid-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Popover, PopoverAnchor } from "~/components/ui/popover";
import type { Course } from "~/types";
import { CourseSuggestionDropdown } from "../../../../../RequiredCoursesEditor/CourseIdRow/CourseSuggestion";
import { useSuggestionSearch } from "../../../../../RequiredCoursesEditor/CourseIdRow/CourseSuggestion/useSuggestionSearch";
import { uniqueCourseIds } from "../../../../../utils/courseGroup";

interface CourseNamesInputProps {
  courseNames: string[];
  onUpdate: (courseNames: string[]) => void;
}

export const CourseNamesInput: Component<CourseNamesInputProps> = (props) => {
  const [focusedIndex, setFocusedIndex] = createSignal<number | null>(null);
  const [inputValues, setInputValues] = createSignal<Map<number, string>>(new Map());

  const suggestionSearch = useSuggestionSearch(() => focusedIndex() !== null);

  const displayItems = () => [...props.courseNames, ""];
  const selectedNames = () => new Set(props.courseNames);

  const handleInputChange = (index: number, value: string) => {
    const newMap = new Map(inputValues());
    newMap.set(index, value);
    setInputValues(newMap);
    suggestionSearch.search(value.trim());
  };

  const handleFocus = (index: number, currentValue: string) => {
    setFocusedIndex(index);
    const inputValue = inputValues().get(index);
    suggestionSearch.search((inputValue ?? currentValue).trim());
  };

  const handleBlur = (index: number, currentValue: string) => {
    if (focusedIndex() === index) {
      setFocusedIndex(null);
      suggestionSearch.clear();
    }

    const inputValue = inputValues().get(index)?.trim() ?? "";
    const newMap = new Map(inputValues());
    newMap.delete(index);
    setInputValues(newMap);

    if (inputValue === "") {
      if (index < props.courseNames.length) {
        const updated = props.courseNames.filter((_, i) => i !== index);
        props.onUpdate(uniqueCourseIds(updated));
      }
    } else if (inputValue !== currentValue) {
      if (index === props.courseNames.length) {
        const updated = [...props.courseNames, inputValue];
        props.onUpdate(uniqueCourseIds(updated));
      } else {
        const updated = props.courseNames.map((name, i) => (i === index ? inputValue : name));
        props.onUpdate(uniqueCourseIds(updated));
      }
    }
  };

  const handleDelete = (index: number) => {
    const updated = props.courseNames.filter((_, i) => i !== index);
    props.onUpdate(uniqueCourseIds(updated));
  };

  const handleSuggestionSelect = (course: Course) => {
    const index = focusedIndex();
    if (index === null) return;

    if (index === props.courseNames.length) {
      const updated = [...props.courseNames, course.name];
      props.onUpdate(uniqueCourseIds(updated));
    } else {
      const updated = props.courseNames.map((name, i) => (i === index ? course.name : name));
      props.onUpdate(uniqueCourseIds(updated));
    }

    const newMap = new Map(inputValues());
    newMap.delete(index);
    setInputValues(newMap);
    suggestionSearch.resetQuery();
  };

  return (
    <div class="space-y-1">
      <For each={displayItems()}>
        {(courseName, index) => {
          const isLastEmptyRow = () => index() === props.courseNames.length;
          const currentFocused = () => focusedIndex() === index();
          const currentValue = () => inputValues().get(index()) ?? courseName;

          return (
            <Popover
              open={
                currentFocused() &&
                (suggestionSearch.isLoading() ||
                  suggestionSearch.suggestions().length > 0 ||
                  suggestionSearch.query().length >= 2)
              }
            >
              <PopoverAnchor>
                <div class="flex items-center gap-1">
                  <div class="flex-1">
                    <Input
                      class="h-8"
                      value={currentValue()}
                      onInput={(e) => handleInputChange(index(), e.currentTarget.value)}
                      onFocus={(e) => handleFocus(index(), e.currentTarget.value)}
                      onBlur={() => handleBlur(index(), courseName)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder={isLastEmptyRow() ? "新しい科目名を入力" : ""}
                    />
                  </div>
                  {!isLastEmptyRow() && (
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8 shrink-0"
                      onClick={() => handleDelete(index())}
                      type="button"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </PopoverAnchor>
              <CourseSuggestionDropdown
                isVisible={() => currentFocused()}
                suggestions={suggestionSearch.suggestions}
                isLoading={suggestionSearch.isLoading}
                query={suggestionSearch.query}
                selectedIds={selectedNames}
                onSelect={handleSuggestionSelect}
              />
            </Popover>
          );
        }}
      </For>
    </div>
  );
};
