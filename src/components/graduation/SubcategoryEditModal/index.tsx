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
import type { RequirementGroup, RequirementSubcategory } from "~/lib/types";
import { RequiredCoursesEditor } from "./RequiredCoursesEditor";
import { SelectionCoursesEditor } from "./SelectionCoursesEditor";
import { normalizeCourseGroup, normalizeCourseIds } from "./utils/courseGroup";

interface SubcategoryEditModalProps {
  open: boolean;
  subcategory: RequirementSubcategory | null;
  categoryId: string;
  onClose: () => void;
  onSave: (
    categoryId: string,
    subcategoryId: string | null,
    updates: Partial<RequirementSubcategory>,
  ) => void;
}

type SubcategoryTypeOption = { value: "required" | "elective" | "free"; label: string };

const typeOptions: SubcategoryTypeOption[] = [
  { value: "required", label: "必修" },
  { value: "elective", label: "選択" },
  { value: "free", label: "自由" },
];

export const SubcategoryEditModal: Component<SubcategoryEditModalProps> = (props) => {
  const [name, setName] = createSignal("");
  const [type, setType] = createSignal<"required" | "elective" | "free">("required");
  const [courseIds, setCourseIds] = createSignal<string[]>([]);
  const [minCredits, setMinCredits] = createSignal(0);
  const [maxCredits, setMaxCredits] = createSignal<number | undefined>(undefined);
  const [groups, setGroups] = createSignal<RequirementGroup[]>([]);

  createEffect(() => {
    if (props.subcategory) {
      setName(props.subcategory.name);
      setType(props.subcategory.type);
      if (props.subcategory.type === "required") {
        setCourseIds(
          normalizeCourseIds(
            [...(props.subcategory.courseIds ?? [])].map((id) => id.trim()).filter((id) => id),
          ),
        );
        setMinCredits(0);
        setMaxCredits(undefined);
        setGroups([]);
      } else {
        setCourseIds([]);
        setMinCredits(props.subcategory.minCredits);
        setMaxCredits(props.subcategory.maxCredits);
        setGroups(JSON.parse(JSON.stringify(props.subcategory.groups)));
      }
    } else if (props.open) {
      setName("");
      setType("elective");
      setCourseIds([]);
      setMinCredits(0);
      setMaxCredits(undefined);
      setGroups([]);
    }
  });

  const handleSave = () => {
    const updates: Partial<RequirementSubcategory> =
      type() === "required"
        ? {
            name: name(),
            type: type(),
            courseIds: courseIds()
              .map((value) => normalizeCourseGroup(value))
              .filter((value) => value),
          }
        : {
            name: name(),
            type: type(),
            minCredits: minCredits(),
            maxCredits: maxCredits(),
            groups: groups(),
          };

    props.onSave(props.categoryId, props.subcategory?.id ?? null, updates);
    props.onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      props.onClose();
    }
  };

  const selectedType = () => typeOptions.find((opt) => opt.value === type());

  const handleTypeChange = (val: SubcategoryTypeOption | null) => {
    if (!val) return;
    setType(val.value);
    if (val.value === "required") {
      setCourseIds((prev) => normalizeCourseIds(prev));
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {props.subcategory ? "サブカテゴリを編集" : "サブカテゴリを追加"}
          </DialogTitle>
        </DialogHeader>
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
            <Label>科目タイプ</Label>
            <Select
              value={selectedType()}
              onChange={handleTypeChange}
              options={typeOptions}
              optionValue="value"
              optionTextValue="label"
              placeholder="科目タイプを選択"
              disabled={props.subcategory !== null}
              itemComponent={(itemProps) => (
                <SelectItem item={itemProps.item}>{itemProps.item.rawValue.label}</SelectItem>
              )}
            >
              <SelectTrigger>
                <SelectValue<SubcategoryTypeOption>>
                  {(state) => state.selectedOption().label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>

          <Show when={type() === "required"}>
            <RequiredCoursesEditor courseIds={courseIds} setCourseIds={setCourseIds} />
          </Show>

          <Show when={type() !== "required"}>
            <SelectionCoursesEditor
              minCredits={minCredits}
              setMinCredits={setMinCredits}
              maxCredits={maxCredits}
              setMaxCredits={setMaxCredits}
              groups={groups}
              setGroups={setGroups}
            />
          </Show>
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
