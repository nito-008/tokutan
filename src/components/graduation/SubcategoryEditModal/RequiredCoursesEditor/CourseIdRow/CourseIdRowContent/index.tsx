import { GripVertical, Trash2 } from "lucide-solid";
import {
  type Accessor,
  type Component,
  createEffect,
  createSignal,
  type JSX,
  onCleanup,
  Show,
} from "solid-js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Popover, PopoverAnchor } from "~/components/ui/popover";
import type { Course } from "~/lib/types";
import { CourseSuggestionDropdown } from "../CourseSuggestion";
import { useSuggestionSearch } from "../CourseSuggestion/useSuggestionSearch";

export interface CourseIdRowContentProps {
  id: string;
  index: number;
  isPlaceholder: boolean;
  onUpdateCourseId: (index: number, value: string, skipNormalize?: boolean) => void;
  onRemoveCourseId: (index: number) => void;
  // sortable関連（非プレースホルダーのみ）
  sortableRef?: (el: HTMLElement) => void;
  sortableTransform?: { x: number; y: number } | null;
  isActiveDraggable?: boolean;
  dragActivators?: JSX.HTMLAttributes<HTMLElement>;
  sortableCount?: number;
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

export const CourseIdRowContent: Component<CourseIdRowContentProps> = (props) => {
  const [isFocused, setIsFocused] = createSignal(false);
  const [localValue, setLocalValue] = createSignal(props.id);

  // フォーカス外の時のみ親の値をローカルに同期
  createEffect(() => {
    if (!isFocused()) {
      setLocalValue(props.id);
    }
  });

  const suggestionSearch = useSuggestionSearch(isFocused);

  // 入力値が科目名そのものなので、selectedIdsは単一値のSetに
  const selectedIds = () => {
    const trimmedValue = localValue().trim();
    return trimmedValue ? new Set([trimmedValue]) : new Set<string>();
  };

  const handleInputChange = (value: string) => {
    setLocalValue(value);
    suggestionSearch.search(value.trim(), undefined);
  };

  const handleFocusInput = (value: string) => {
    setIsFocused(true);
    suggestionSearch.search(value.trim(), undefined);
  };

  const handleBlurInput = () => {
    if (isFocused()) {
      setIsFocused(false);
      suggestionSearch.clear();
    }
    const trimmedValue = localValue().trim();
    setLocalValue(trimmedValue);
    props.onUpdateCourseId(props.index, trimmedValue);
  };

  const toggleSuggestionSelect = (course: Course) => {
    // 科目名を保存
    const newValue = course.name;
    setLocalValue(newValue);
    props.onUpdateCourseId(props.index, newValue, true);
    // フォーカスを外してポップオーバーを閉じる
    setIsFocused(false);
    suggestionSearch.clear();
  };

  return (
    <div
      ref={props.sortableRef}
      class="flex items-start gap-2"
      classList={{
        "opacity-50": !props.isPlaceholder && props.isActiveDraggable,
        "transition-transform": !props.isPlaceholder && !props.isActiveDraggable,
      }}
      style={
        !props.isPlaceholder && props.sortableTransform
          ? {
              transform: `translateY(${
                props.isActiveDraggable
                  ? clampY(props.sortableTransform.y, props.index, props.sortableCount ?? 0)
                  : props.sortableTransform.y
              }px)`,
            }
          : undefined
      }
    >
      {/* ドラッグハンドル */}
      <Show when={!props.isPlaceholder} fallback={<div class="w-4" />}>
        <div
          {...(props.dragActivators as unknown as JSX.HTMLAttributes<HTMLDivElement>)}
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
                    placeholder={props.isPlaceholder ? "科目名を追加" : "例: 工学システム概論"}
                  />
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

      {/* 削除ボタン */}
      <Show when={!props.isPlaceholder} fallback={<div class="w-10" />}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="text-muted-foreground hover:text-foreground"
          onClick={() => props.onRemoveCourseId(props.index)}
        >
          <Trash2 class="size-4" />
        </Button>
      </Show>
    </div>
  );
};
