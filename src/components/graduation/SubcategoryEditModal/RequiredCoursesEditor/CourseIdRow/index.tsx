import { createSortable } from "@thisbeyond/solid-dnd";
import { GripVertical, Trash2 } from "lucide-solid";
import {
  type Accessor,
  type Component,
  createEffect,
  createSignal,
  onCleanup,
  Show,
} from "solid-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { getCoursesByIds } from "~/lib/db/kdb";
import type { Course } from "~/lib/types";
import {
  dropSearchToken,
  extractSuggestionToken,
  formatCourseGroup,
  formatCourseGroupLabel,
  normalizeCourseGroup,
  parseCourseGroup,
  uniqueCourseIds,
} from "../../utils/courseGroup";
import { CourseSuggestionDropdown } from "./CourseSuggestion";
import { useSuggestionSearch } from "./CourseSuggestion/useSuggestionSearch";

interface CourseIdRowProps {
  id: Accessor<string>;
  index: number;
  totalCount: number;
  onUpdateCourseId: (index: number, value: string) => void;
  onRemoveCourseId: (index: number) => void;
}

// 1行の高さ（Input高さ40px + space-y-2ギャップ8px）
const ROW_HEIGHT = 48;

const clampY = (y: number, currentIndex: number, sortableCount: number): number => {
  // 上方向の制限: 最上部（index 0）より上には行けない
  const minY = -currentIndex * ROW_HEIGHT;
  // 下方向の制限: 最下部（最後のソート可能アイテム）より下には行けない
  const maxY = (sortableCount - 1 - currentIndex) * ROW_HEIGHT;
  return Math.max(minY, Math.min(maxY, y));
};

export const CourseIdRow: Component<CourseIdRowProps> = (props) => {
  const [requiredCourseNames, setRequiredCourseNames] = createSignal<Map<string, string>>(
    new Map(),
  );
  const [isCourseLookupLoading, setIsCourseLookupLoading] = createSignal(false);
  const [isFocused, setIsFocused] = createSignal(false);
  const [hasActiveSearch, setHasActiveSearch] = createSignal(false);

  const suggestionSearch = useSuggestionSearch(isFocused);

  const isPlaceholderRow = () => props.index === props.totalCount - 1;
  // プレースホルダー以外でSortableを作成
  const sortable = createSortable(props.index);
  const groupIds = () => uniqueCourseIds(parseCourseGroup(props.id()));
  const selectedIds = () => new Set(groupIds());
  const getRelatedCourseId = (value: string) => {
    if (!value.includes(",")) return undefined;
    const [firstToken] = value.split(",");
    const trimmed = firstToken?.trim();
    return trimmed || undefined;
  };
  const isMissingCourse = () =>
    groupIds().length > 0 &&
    !isFocused() &&
    !isPlaceholderRow() &&
    !isCourseLookupLoading() &&
    groupIds().some((courseId) => !requiredCourseNames().has(courseId));

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
    suggestionSearch.search(extractSuggestionToken(value), getRelatedCourseId(value));
  };

  const handleFocusInput = (value: string) => {
    setIsFocused(true);
    suggestionSearch.search(extractSuggestionToken(value), getRelatedCourseId(value));
  };

  const handleBlurInput = (value: string) => {
    if (isFocused()) {
      setIsFocused(false);
      suggestionSearch.clear();
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
    const nextIds = currentIds.includes(course.id)
      ? currentIds.filter((id) => id !== course.id)
      : [...currentIds, course.id];
    setRequiredCourseNames((prev) => {
      const next = new Map(prev);
      next.set(course.id, course.name);
      return next;
    });
    props.onUpdateCourseId(props.index, formatCourseGroup(nextIds));
    suggestionSearch.resetQuery();
    setHasActiveSearch(false);
  };

  return (
    <div
      ref={!isPlaceholderRow() ? sortable.ref : undefined}
      class="flex items-start gap-2"
      classList={{
        "opacity-50": !isPlaceholderRow() && sortable.isActiveDraggable,
        "transition-transform": !isPlaceholderRow() && !sortable.isActiveDraggable,
      }}
      style={
        !isPlaceholderRow() && sortable.transform
          ? {
              transform: `translateY(${clampY(
                sortable.transform.y,
                props.index,
                props.totalCount - 1, // プレースホルダーを除いたソート可能アイテム数
              )}px)`,
            }
          : undefined
      }
    >
      {/* ドラッグハンドル */}
      <Show when={!isPlaceholderRow()} fallback={<div class="w-4" />}>
        <div
          {...sortable.dragActivators}
          class="mt-2.5 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical class="size-4" />
        </div>
      </Show>

      {/* 既存の入力フィールド */}
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
                    suggestionSearch.clear();
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
              <CourseSuggestionDropdown
                isVisible={isFocused}
                suggestions={suggestionSearch.suggestions}
                isLoading={suggestionSearch.isLoading}
                query={suggestionSearch.query}
                selectedIds={selectedIds}
                onSelect={toggleSuggestionSelect}
              />
            </div>
          );
        })()}
      </div>

      {/* 削除ボタン */}
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
