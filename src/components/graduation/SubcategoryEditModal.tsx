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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { RequirementSubcategory } from "~/lib/types";

interface SubcategoryEditModalProps {
  open: boolean;
  subcategory: RequirementSubcategory | null;
  categoryId: string;
  onClose: () => void;
  onSave: (
    categoryId: string,
    subcategoryId: string,
    updates: Partial<RequirementSubcategory>,
  ) => void;
}

const typeOptions = [
  { value: "required", label: "必修" },
  { value: "elective", label: "選択" },
  { value: "free", label: "自由" },
] as const;

export const SubcategoryEditModal: Component<SubcategoryEditModalProps> = (props) => {
  const [name, setName] = createSignal("");
  const [type, setType] = createSignal<"required" | "elective" | "free">("required");
  const [minCredits, setMinCredits] = createSignal(0);
  const [maxCredits, setMaxCredits] = createSignal<number | undefined>(undefined);
  const [notes, setNotes] = createSignal<string | undefined>(undefined);

  createEffect(() => {
    if (props.subcategory) {
      setName(props.subcategory.name);
      setType(props.subcategory.type);
      setMinCredits(props.subcategory.minCredits);
      setMaxCredits(props.subcategory.maxCredits);
      setNotes(props.subcategory.notes);
    }
  });

  const handleSave = () => {
    if (!props.subcategory) return;

    const updates: Partial<RequirementSubcategory> = {
      name: name(),
      type: type(),
      minCredits: minCredits(),
      maxCredits: maxCredits(),
      notes: notes(),
    };

    props.onSave(props.categoryId, props.subcategory.id, updates);
    props.onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      props.onClose();
    }
  };

  const selectedType = () => typeOptions.find((opt) => opt.value === type());

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>サブカテゴリを編集</DialogTitle>
        </DialogHeader>

        <Show when={props.subcategory}>
          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label for="subcategory-name">名前</Label>
              <Input
                id="subcategory-name"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
              />
            </div>

            <div class="space-y-2">
              <Label>タイプ</Label>
              <Select
                value={selectedType()}
                onChange={(val) => val && setType(val.value)}
                options={typeOptions}
                optionValue="value"
                optionTextValue="label"
                placeholder="タイプを選択"
                itemComponent={(itemProps) => (
                  <SelectItem item={itemProps.item}>{itemProps.item.rawValue.label}</SelectItem>
                )}
              >
                <SelectTrigger>
                  <SelectValue<(typeof typeOptions)[number]>>
                    {(state) => state.selectedOption().label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="sub-min-credits">最小単位数</Label>
                <Input
                  id="sub-min-credits"
                  type="number"
                  min="0"
                  value={minCredits()}
                  onInput={(e) => {
                    const val = e.currentTarget.value;
                    setMinCredits(val ? Number.parseInt(val, 10) : 0);
                  }}
                />
              </div>

              <div class="space-y-2">
                <Label for="sub-max-credits">最大単位数</Label>
                <Input
                  id="sub-max-credits"
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

            <div class="space-y-2">
              <Label for="subcategory-notes">メモ</Label>
              <Input
                id="subcategory-notes"
                value={notes() ?? ""}
                onInput={(e) => {
                  const val = e.currentTarget.value;
                  setNotes(val || undefined);
                }}
                placeholder="任意"
              />
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
