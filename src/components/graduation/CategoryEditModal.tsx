import { type Component, createEffect, createSignal, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { RequirementCategory } from "~/lib/types";

interface CategoryEditModalProps {
  open: boolean;
  category: RequirementCategory | null;
  onClose: () => void;
  onSave: (categoryId: string, updates: Partial<RequirementCategory>) => void;
}

export const CategoryEditModal: Component<CategoryEditModalProps> = (props) => {
  const [name, setName] = createSignal("");
  const [minCredits, setMinCredits] = createSignal<number | undefined>(undefined);
  const [maxCredits, setMaxCredits] = createSignal<number | undefined>(undefined);

  createEffect(() => {
    if (props.category) {
      setName(props.category.name);
      setMinCredits(props.category.minCredits);
      setMaxCredits(props.category.maxCredits);
    }
  });

  const handleSave = () => {
    if (!props.category) return;

    const updates: Partial<RequirementCategory> = {
      name: name(),
      minCredits: minCredits(),
      maxCredits: maxCredits(),
    };

    props.onSave(props.category.id, updates);
    props.onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      props.onClose();
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>カテゴリを編集</DialogTitle>
        </DialogHeader>

        <Show when={props.category}>
          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label for="category-name">名前</Label>
              <Input
                id="category-name"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="min-credits">最小単位数</Label>
                <Input
                  id="min-credits"
                  type="number"
                  min="0"
                  value={minCredits() ?? ""}
                  onInput={(e) => {
                    const val = e.currentTarget.value;
                    setMinCredits(val ? Number.parseInt(val, 10) : undefined);
                  }}
                />
              </div>

              <div class="space-y-2">
                <Label for="max-credits">最大単位数</Label>
                <Input
                  id="max-credits"
                  type="number"
                  min="0"
                  value={maxCredits() ?? ""}
                  onInput={(e) => {
                    const val = e.currentTarget.value;
                    setMaxCredits(val ? Number.parseInt(val, 10) : undefined);
                  }}
                />
              </div>
            </div>
          </div>
        </Show>

        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
