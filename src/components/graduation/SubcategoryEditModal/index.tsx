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
import { getSubcategoryLabel } from "~/lib/requirements/subcategory";
import type { RequirementGroup, RequirementSubcategory } from "~/lib/types";
import { RequiredCoursesEditor } from "./RequiredCoursesEditor";
import { SelectionCoursesEditor } from "./SelectionCoursesEditor";
import { normalizeCourseGroup, normalizeCourseIds } from "./utils/courseGroup";

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
        setGroups([]);
      } else {
        setCourseIds([]);
        setMinCredits(props.subcategory.minCredits);
        setMaxCredits(props.subcategory.maxCredits);
        setGroups(
          reconcile(JSON.parse(JSON.stringify(props.subcategory.groups)), {
            key: "id",
          }),
        );
      }
    } else if (props.open) {
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
            type: type(),
            courseIds: courseIds()
              .map((value) => normalizeCourseGroup(value))
              .filter((value) => value),
          }
        : {
            type: type(),
            minCredits: minCredits(),
            maxCredits: maxCredits(),
            groups: JSON.parse(JSON.stringify(unwrap(groups))),
          };

    props.onSave(props.categoryId, props.subcategory?.id ?? null, updates);
    props.onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      props.onClose();
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {props.subcategory
              ? `${props.categoryName} > ${getSubcategoryLabel(props.subcategory.type)}`
              : "サブカテゴリを追加"}
          </DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4">
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
