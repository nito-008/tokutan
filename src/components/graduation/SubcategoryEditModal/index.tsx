import { type Component, createEffect, createSignal, Show } from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  getSubcategoryLabel,
  type SubcategoryTypeOption,
  subcategoryTypeOptions,
} from "~/lib/requirements/subcategory";
import type { RequirementGroup, RequirementSubcategory } from "~/lib/types";
import { RequiredCoursesEditor } from "./RequiredCoursesEditor";
import { SelectionCoursesEditor } from "./SelectionCoursesEditor";
import { normalizeCourseIds } from "./utils/courseGroup";

interface SubcategoryEditModalProps {
  open: boolean;
  subcategory: RequirementSubcategory | null;
  categoryId: string;
  categoryName: string;
  onClose: () => void;
  onDelete?: (categoryId: string, subcategoryId: string) => void;
  onSave: (
    categoryId: string,
    subcategoryId: string | null,
    updates: Partial<RequirementSubcategory>,
  ) => void;
}

export const SubcategoryEditModal: Component<SubcategoryEditModalProps> = (props) => {
  const [type, setType] = createSignal<"required" | "elective" | "free">("required");
  const [courseIds, setCourseIds] = createSignal<string[]>([]);
  const [minCredits, setMinCredits] = createSignal(0);
  const [maxCredits, setMaxCredits] = createSignal<number | undefined>(undefined);
  const [groups, setGroups] = createStore<RequirementGroup[]>([]);

  createEffect(() => {
    if (!props.open) return;

    if (props.subcategory) {
      setType(props.subcategory.type);
      if (props.subcategory.type === "required") {
        setCourseIds(
          normalizeCourseIds(
            [...(props.subcategory.courseIds ?? [])].map((id) => id.trim()).filter((id) => id),
          ),
        );
        setMinCredits(0);
        setMaxCredits(undefined);
      } else {
        setCourseIds([]);
        setMinCredits(props.subcategory.minCredits);
        setMaxCredits(props.subcategory.maxCredits);
      }

      setGroups(
        reconcile(JSON.parse(JSON.stringify(props.subcategory.groups ?? [])), {
          key: "id",
        }),
      );
    } else {
      setType("elective");
      setCourseIds([]);
      setMinCredits(0);
      setMaxCredits(undefined);
      setGroups([]);
    }
  });

  const handleSave = () => {
    const serializedGroups = JSON.parse(JSON.stringify(unwrap(groups)));
    const updates: Partial<RequirementSubcategory> =
      type() === "required"
        ? {
            type: type(),
            courseIds: courseIds()
              .map((value) => value.trim())
              .filter((value) => value),
            groups: serializedGroups,
          }
        : {
            type: type(),
            minCredits: minCredits(),
            maxCredits: maxCredits(),
            groups: serializedGroups,
          };

    props.onSave(props.categoryId, props.subcategory?.id ?? null, updates);
    props.onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      props.onClose();
    }
  };

  const selectedType = () => subcategoryTypeOptions.find((opt) => opt.value === type());

  const handleTypeChange = (val: SubcategoryTypeOption | null) => {
    if (!val) return;
    setType(val.value);
    if (val.value === "required") {
      setCourseIds((prev) => normalizeCourseIds(prev));
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent
        class="max-w-2xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {props.subcategory
              ? `${props.categoryName} > ${getSubcategoryLabel(props.subcategory.type)}`
              : "サブカテゴリを追加"}
          </DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>科目タイプ</Label>
            <Select
              value={selectedType()}
              onChange={handleTypeChange}
              options={subcategoryTypeOptions}
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
            <RequiredCoursesEditor
              courseIds={courseIds}
              setCourseIds={setCourseIds}
              groups={groups}
              setGroups={setGroups}
            />
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
          <Show when={props.subcategory && props.onDelete}>
            <Button
              variant="destructive"
              onClick={() => {
                if (!props.subcategory) return;
                props.onDelete?.(props.categoryId, props.subcategory.id);
                props.onClose();
              }}
            >
              削除
            </Button>
          </Show>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
