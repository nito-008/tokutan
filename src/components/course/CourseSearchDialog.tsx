import { type Component, createSignal, For, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { searchKdb } from "~/lib/db/kdb";
import type { Course, PlannedCourse } from "~/lib/types";

interface CourseSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (course: PlannedCourse) => void;
}

export const CourseSearchDialog: Component<CourseSearchDialogProps> = (props) => {
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<Course[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [showManual, setShowManual] = createSignal(false);

  // 手動入力用
  const [manualId, setManualId] = createSignal("");
  const [manualName, setManualName] = createSignal("");
  const [manualCredits, setManualCredits] = createSignal("2");

  let searchTimeout: number | null = null;

  const handleSearch = (value: string) => {
    setQuery(value);

    // デバウンス処理
    if (searchTimeout) clearTimeout(searchTimeout);

    if (value.length < 2) {
      setResults([]);
      return;
    }

    searchTimeout = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const found = await searchKdb(value);
        setResults(found);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectCourse = (course: Course) => {
    props.onSelect({
      courseId: course.id,
      courseName: course.name,
      credits: course.credits,
      status: "planned",
    });
  };

  const handleManualAdd = () => {
    if (!manualId() || !manualName()) return;

    props.onSelect({
      courseId: manualId(),
      courseName: manualName(),
      credits: parseFloat(manualCredits()) || 2,
      status: "planned",
    });

    // リセット
    setManualId("");
    setManualName("");
    setManualCredits("2");
  };

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent class="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>科目を追加</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* 検索フォーム */}
          <Input
            placeholder="科目番号または科目名で検索..."
            value={query()}
            onInput={(e) => handleSearch(e.currentTarget.value)}
          />

          {/* 検索結果 */}
          <div class="flex-1 overflow-y-auto">
            <Show when={isSearching()}>
              <p class="text-sm text-muted-foreground text-center py-4">検索中...</p>
            </Show>

            <Show when={!isSearching() && results().length > 0}>
              <div class="space-y-2">
                <For each={results()}>
                  {(course) => (
                    <div
                      class="p-3 border rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => handleSelectCourse(course)}
                    >
                      <div class="flex items-center justify-between">
                        <span class="font-medium">{course.name}</span>
                        <span class="text-sm text-muted-foreground">{course.credits}単位</span>
                      </div>
                      <div class="text-xs text-muted-foreground mt-1">
                        {course.id} / {course.semester} {course.schedule}
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>

            <Show when={!isSearching() && query().length >= 2 && results().length === 0}>
              <p class="text-sm text-muted-foreground text-center py-4">
                該当する科目が見つかりません
              </p>
            </Show>
          </div>

          {/* 手動追加フォーム */}
          <div class="border-t pt-4">
            <Button variant="link" class="p-0 h-auto" onClick={() => setShowManual(!showManual())}>
              {showManual() ? "▲ 手動入力を閉じる" : "▼ 手動で追加"}
            </Button>

            <Show when={showManual()}>
              <div class="grid grid-cols-3 gap-2 mt-3">
                <div>
                  <Label class="text-xs">科目番号</Label>
                  <Input
                    placeholder="FG10784"
                    value={manualId()}
                    onInput={(e) => setManualId(e.currentTarget.value)}
                  />
                </div>
                <div class="col-span-2">
                  <Label class="text-xs">科目名</Label>
                  <Input
                    placeholder="複素解析"
                    value={manualName()}
                    onInput={(e) => setManualName(e.currentTarget.value)}
                  />
                </div>
                <div>
                  <Label class="text-xs">単位数</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={manualCredits()}
                    onInput={(e) => setManualCredits(e.currentTarget.value)}
                  />
                </div>
                <div class="col-span-2 flex items-end">
                  <Button
                    size="sm"
                    class="w-full"
                    onClick={handleManualAdd}
                    disabled={!manualId() || !manualName()}
                  >
                    追加
                  </Button>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
