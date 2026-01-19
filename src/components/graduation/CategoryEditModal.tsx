import { type Component, createEffect, createSignal } from "solid-js";
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
  onSave: (categoryId: string | null, updates: Partial<RequirementCategory>) => void;
}

export const CategoryEditModal: Component<CategoryEditModalProps> = (props) => {
  const [name, setName] = createSignal("");

  createEffect(() => {
    if (props.category) {
      setName(props.category.name);
    } else if (props.open) {
      setName("");
    }
  });

  const handleSave = () => {
    const updates: Partial<RequirementCategory> = {
      name: name(),
    };

    props.onSave(props.category?.id ?? null, updates);
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
          <DialogTitle>{props.category ? "カテゴリを編集" : "カテゴリを追加"}</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="category-name">名前</Label>
            <Input
              id="category-name"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
            />
          </div>
        </div>

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
