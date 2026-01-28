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
import type { RequirementGroup, RequirementSubcategory } from "~/types";
import { RequiredCoursesEditor } from "./RequiredCoursesEditor";
import { SelectionCoursesEditor } from "./SelectionCoursesEditor";

interface SubcategoryEditModalProps {
  open: boolean;
  subcategory: RequirementSubcategory | null;
  categoryId: string;
  categoryName: string;
  onClose: () => void;
  onSave: (
    categoryId: string,
    subcategoryId: string,
    updates: Partial<RequirementSubcategory>,
  ) => void;
}

export const SubcategoryEditModal: Component<SubcategoryEditModalProps> = (props) => {
  const [type, setType] = createSignal<"required" | "elective" | "free">("required");
  const [minCredits, setMinCredits] = createSignal(0);
  const [maxCredits, setMaxCredits] = createSignal<number | undefined>(undefined);
  const [groups, setGroups] = createStore<RequirementGroup[]>([]);

  createEffect(() => {
    if (props.subcategory) {
      setType(props.subcategory.type);
      if (props.subcategory.type === "required") {
        setMinCredits(0);
        setMaxCredits(undefined);
        setGroups(
          reconcile(
            props.subcategory.groups ? JSON.parse(JSON.stringify(props.subcategory.groups)) : [],
            { key: "id" },
          ),
        );
      } else {
        setMinCredits(props.subcategory.minCredits);
        setMaxCredits(props.subcategory.maxCredits);
        setGroups(
          reconcile(
            props.subcategory.groups ? JSON.parse(JSON.stringify(props.subcategory.groups)) : [],
            { key: "id" },
          ),
        );
      }
    } else if (props.open) {
      setType("elective");
      setMinCredits(0);
      setMaxCredits(undefined);
      setGroups([]);
    }
  });

  const handleSave = () => {
    if (!props.subcategory) return;
    const updates: Partial<RequirementSubcategory> =
      type() === "required"
        ? {
            type: type(),
            groups: JSON.parse(JSON.stringify(unwrap(groups))),
          }
        : {
            type: type(),
            minCredits: minCredits(),
            maxCredits: maxCredits(),
            groups: JSON.parse(JSON.stringify(unwrap(groups))),
          };

    props.onSave(props.categoryId, props.subcategory.id, updates);
    props.onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      props.onClose();
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
              ? `${props.categoryName} ${getSubcategoryLabel(props.subcategory.type)}`
              : "サブカテゴリを追加"}
          </DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <Show when={type() === "required"}>
            <RequiredCoursesEditor groups={groups} setGroups={setGroups} />
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
