import Plus from "lucide-solid/icons/plus";
import { type Component, createSignal } from "solid-js";
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
import { updateSelectedRequirements } from "~/lib/db/profiles";
import { saveRequirements } from "~/lib/db/requirements";
import { generateCategoryId, generateRequirementId, generateSubcategoryId } from "~/lib/id";
import { useAppState, useAppStateActions } from "~/stores/appState";
import type { GraduationRequirements, RequirementCategory } from "~/types";

const DEFAULT_TOTAL_CREDITS = 125;

/**
 * 空の要件カテゴリを作成する。
 * @param name カテゴリ名
 * @returns 必修・選択サブカテゴリを持つカテゴリ
 */
function createEmptyCategory(name: string): RequirementCategory {
  return {
    id: generateCategoryId(),
    name,
    subcategories: [
      {
        id: generateSubcategoryId(),
        type: "required",
        groups: [],
      },
      {
        id: generateSubcategoryId(),
        type: "elective",
        minCredits: 0,
        groups: [],
      },
    ],
  };
}

/**
 * 卒業要件データの空テンプレートを作成する。
 * @param year 入学年度
 * @param department 学類
 * @param major 専攻
 * @param totalCredits 卒業必要単位数
 * @returns 新規卒業要件
 */
function buildEmptyRequirements(
  year: number,
  department: string,
  major: string,
  totalCredits: number,
): GraduationRequirements {
  const now = new Date().toISOString();
  return {
    id: generateRequirementId(),
    year,
    department,
    major,
    totalCredits,
    categories: [
      createEmptyCategory("専門科目"),
      createEmptyCategory("専門基礎科目"),
      createEmptyCategory("基礎科目共通科目"),
      createEmptyCategory("基礎科目関連科目"),
    ],
    version: "1.0.0",
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
}

export const CreateRequirementsDialog: Component = () => {
  const appState = useAppState();
  const { updateRequirements, updateProfile } = useAppStateActions();

  const [open, setOpen] = createSignal(false);
  const [year, setYear] = createSignal<string>(String(new Date().getFullYear()));
  const [department, setDepartment] = createSignal("");
  const [major, setMajor] = createSignal("");
  const [totalCredits, setTotalCredits] = createSignal<string>(String(DEFAULT_TOTAL_CREDITS));
  const [isSaving, setIsSaving] = createSignal(false);

  const resetForm = () => {
    setYear(String(new Date().getFullYear()));
    setDepartment("");
    setMajor("");
    setTotalCredits(String(DEFAULT_TOTAL_CREDITS));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const handleSave = async () => {
    const parsedYear = Number(year());
    const parsedTotalCredits = Number(totalCredits());
    const trimmedDepartment = department().trim();
    const trimmedMajor = major().trim();

    if (
      !Number.isInteger(parsedYear) ||
      parsedYear < 1900 ||
      parsedYear > 2100 ||
      trimmedDepartment.length === 0 ||
      trimmedMajor.length === 0 ||
      Number.isNaN(parsedTotalCredits) ||
      parsedTotalCredits < 0
    ) {
      return;
    }

    const profile = appState()?.profile;
    if (!profile) return;

    const newRequirements = buildEmptyRequirements(
      parsedYear,
      trimmedDepartment,
      trimmedMajor,
      parsedTotalCredits,
    );

    setIsSaving(true);
    try {
      await saveRequirements(newRequirements);
      await updateSelectedRequirements(profile.id, newRequirements.id);
      updateProfile((current) => ({ ...current, selectedRequirementsId: newRequirements.id }));
      updateRequirements(newRequirements);
      handleOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus />
        <span>卒業要件を作成</span>
      </Button>
      <Dialog open={open()} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>卒業要件を作成</DialogTitle>
          </DialogHeader>

          <div class="space-y-4 py-2">
            <div class="space-y-2">
              <Label for="requirements-year">入学年度</Label>
              <Input
                id="requirements-year"
                type="number"
                min={1900}
                max={2100}
                value={year()}
                onInput={(e) => setYear(e.currentTarget.value)}
              />
            </div>

            <div class="space-y-2">
              <Label for="requirements-department">学類</Label>
              <Input
                id="requirements-department"
                type="text"
                value={department()}
                onInput={(e) => setDepartment(e.currentTarget.value)}
              />
            </div>

            <div class="space-y-2">
              <Label for="requirements-major">専攻</Label>
              <Input
                id="requirements-major"
                type="text"
                value={major()}
                onInput={(e) => setMajor(e.currentTarget.value)}
              />
            </div>

            <div class="space-y-2">
              <Label for="requirements-total-credits">卒業必要単位数</Label>
              <Input
                id="requirements-total-credits"
                type="number"
                min={0}
                value={totalCredits()}
                onInput={(e) => setTotalCredits(e.currentTarget.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              キャンセル
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
