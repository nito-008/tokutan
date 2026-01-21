import {
  type Accessor,
  type Component,
  createEffect,
  createSignal,
  Index,
  onCleanup,
  type Setter,
} from "solid-js";
import { toast } from "solid-sonner";
import { Label } from "~/components/ui/label";
import { getCoursesByIds, searchKdb } from "~/lib/db/kdb";
import type { Course } from "~/lib/types";
import {
  dropSearchToken,
  extractSuggestionToken,
  formatCourseGroup,
  getGroupName,
  normalizeCourseGroup,
  normalizeCourseIds,
  parseCourseGroup,
  uniqueCourseIds,
} from "../utils/courseGroup";
import { CourseIdRow } from "./CourseIdRow";

interface RequiredCoursesEditorProps {
  courseIds: Accessor<string[]>;
  setCourseIds: Setter<string[]>;
}

export const RequiredCoursesEditor: Component<RequiredCoursesEditorProps> = (props) => {
  const [requiredCourseNames, setRequiredCourseNames] = createSignal<Map<string, string>>(
    new Map(),
  );
  const [isCourseLookupLoading, setIsCourseLookupLoading] = createSignal(false);
  const [focusedCourseIndex, setFocusedCourseIndex] = createSignal<number | null>(null);
  const [courseSuggestions, setCourseSuggestions] = createSignal<Course[]>([]);
  const [isSuggestionLoading, setIsSuggestionLoading] = createSignal(false);
  const [suggestionIndex, setSuggestionIndex] = createSignal<number | null>(null);
  const [suggestionQuery, setSuggestionQuery] = createSignal("");
  const [hasActiveSearch, setHasActiveSearch] = createSignal(false);
  let suggestionTimeout: number | null = null;
  let suggestionRequestId = 0;

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
    setSuggestionIndex(null);
    setHasActiveSearch(false);
  };

  const requestSuggestions = (index: number, value: string) => {
    const normalizedValue = value.trim();
    if (suggestionTimeout) {
      clearTimeout(suggestionTimeout);
      suggestionTimeout = null;
    }
    setSuggestionIndex(index);
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
        if (focusedCourseIndex() !== index) return;
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
    const ids = uniqueCourseIds(props.courseIds().flatMap((value) => parseCourseGroup(value)));
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

  const updateCourseId = (index: number, value: string, options?: { skipSuggest?: boolean }) => {
    props.setCourseIds((prev) =>
      normalizeCourseIds(prev.map((id, i) => (i === index ? value : id))),
    );
    if (!options?.skipSuggest) {
      requestSuggestions(index, extractSuggestionToken(value));
    }
  };

  const handleInputChange = (index: number, value: string) => {
    setHasActiveSearch(true);
    updateCourseId(index, value);
  };

  const handleFocusInput = (index: number, value: string) => {
    setFocusedCourseIndex(index);
    requestSuggestions(index, extractSuggestionToken(value));
  };

  const handleBlurInput = (index: number, value: string) => {
    if (focusedCourseIndex() === index) {
      setFocusedCourseIndex(null);
      clearSuggestions();
    }
    setHasActiveSearch(false);
    updateCourseId(index, normalizeCourseGroup(value), { skipSuggest: true });
  };

  const toggleSuggestionSelect = (index: number, course: Course) => {
    const currentValue = props.courseIds()[index] ?? "";
    const baseIds = hasActiveSearch()
      ? dropSearchToken(currentValue)
      : parseCourseGroup(currentValue);
    const currentIds = uniqueCourseIds(baseIds);
    const currentName = getGroupName(currentIds, requiredCourseNames());
    if (currentName && currentName !== course.name) {
      toast.error("同じ科目名のものしか選択できません");
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
    updateCourseId(index, formatCourseGroup(nextIds), { skipSuggest: true });
    resetSuggestionQuery();
    setHasActiveSearch(false);
  };

  const removeCourseId = (index: number) => {
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
              focusedCourseIndex={focusedCourseIndex}
              setFocusedCourseIndex={setFocusedCourseIndex}
              requiredCourseNames={requiredCourseNames}
              isCourseLookupLoading={isCourseLookupLoading}
              courseSuggestions={courseSuggestions}
              isSuggestionLoading={isSuggestionLoading}
              suggestionIndex={suggestionIndex}
              suggestionQuery={suggestionQuery}
              onInputChange={handleInputChange}
              onFocusInput={handleFocusInput}
              onBlurInput={handleBlurInput}
              onToggleSuggestion={toggleSuggestionSelect}
              onRemove={removeCourseId}
              clearSuggestions={clearSuggestions}
            />
          )}
        </Index>
      </div>
    </div>
  );
};
