import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  Show,
} from "solid-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { updateSelectedRequirements } from "~/lib/db/profiles";
import { getAllRequirements } from "~/lib/db/requirements";
import {
  type DepartmentOption,
  type MajorOption,
  type YearOption,
  findRequirement,
  getAvailableDepartments,
  getAvailableMajors,
  getAvailableYears,
} from "~/lib/requirements/selector-utils";
import { useAppState, useAppStateActions } from "~/stores/appState";
import type { GraduationRequirements } from "~/types";

export const RequirementsSelector: Component = () => {
  const appState = useAppState();
  const { updateRequirements, updateProfile } = useAppStateActions();
  const [requirements, setRequirements] = createSignal<GraduationRequirements[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);

  const [selectedYear, setSelectedYear] = createSignal<number | undefined>();
  const [selectedDepartment, setSelectedDepartment] = createSignal<string | undefined>();
  const [selectedMajor, setSelectedMajor] = createSignal<string | null | undefined>();

  onMount(async () => {
    try {
      const allReqs = await getAllRequirements();
      setRequirements(allReqs);
    } catch (error) {
      console.error("Failed to load requirements:", error);
    } finally {
      setIsLoading(false);
    }
  });

  createEffect(() => {
    const currentReq = appState()?.requirements;
    if (currentReq && requirements().length > 0) {
      setSelectedYear(currentReq.year);
      setSelectedDepartment(currentReq.department);
      setSelectedMajor(currentReq.major ?? null);
    }
  });

  const yearOptions = createMemo(() => getAvailableYears(requirements()));

  const departmentOptions = createMemo(() => {
    const year = selectedYear();
    if (!year) return [];
    return getAvailableDepartments(requirements(), year);
  });

  const majorOptions = createMemo(() => {
    const year = selectedYear();
    const dept = selectedDepartment();
    if (!year || !dept) return [];
    return getAvailableMajors(requirements(), year, dept);
  });

  const showMajorSelect = createMemo(() => majorOptions().length > 0);

  const updateRequirementsSelection = async (
    year: number,
    department: string,
    major: string | null,
  ) => {
    const req = findRequirement(requirements(), year, department, major);
    if (!req) return;

    const profile = appState()?.profile;
    if (!profile) return;

    try {
      await updateSelectedRequirements(profile.id, req.id);
      updateProfile((current) => ({ ...current, selectedRequirementsId: req.id }));
      updateRequirements(req);
    } catch (error) {
      console.error("Failed to update selected requirements:", error);
    }
  };

  const handleYearChange = (option: YearOption | null) => {
    const year = option?.value;
    setSelectedYear(year);
    setSelectedDepartment(undefined);
    setSelectedMajor(undefined);
  };

  const handleDepartmentChange = async (option: DepartmentOption | null) => {
    const dept = option?.value;
    setSelectedDepartment(dept);
    setSelectedMajor(undefined);

    if (!dept || !selectedYear()) return;

    const majors = getAvailableMajors(requirements(), selectedYear()!, dept);

    if (majors.length === 0) {
      await updateRequirementsSelection(selectedYear()!, dept, null);
    } else if (majors.length === 1) {
      setSelectedMajor(majors[0].value);
      await updateRequirementsSelection(selectedYear()!, dept, majors[0].value);
    }
  };

  const handleMajorChange = async (option: MajorOption | null) => {
    const major = option?.value ?? null;
    setSelectedMajor(major);

    if (selectedYear() && selectedDepartment()) {
      await updateRequirementsSelection(selectedYear()!, selectedDepartment()!, major);
    }
  };

  const selectedYearOption = createMemo(() =>
    yearOptions().find((o) => o.value === selectedYear()),
  );

  const selectedDepartmentOption = createMemo(() =>
    departmentOptions().find((o) => o.value === selectedDepartment()),
  );

  const selectedMajorOption = createMemo(() =>
    majorOptions().find((o) => o.value === selectedMajor()),
  );

  return (
    <Show when={!isLoading()} fallback={<div class="h-10 animate-pulse bg-muted rounded-md" />}>
      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-sm font-medium text-foreground whitespace-nowrap">卒業要件:</span>

        <Select
          value={selectedYearOption()}
          onChange={handleYearChange}
          options={yearOptions()}
          optionValue="value"
          placeholder="入学年度"
          itemComponent={(selectProps) => (
            <SelectItem item={selectProps.item}>{selectProps.item.rawValue.label}</SelectItem>
          )}
        >
          <SelectTrigger class="w-32">
            <SelectValue<YearOption>>
              {(state) => state.selectedOption()?.label || "入学年度"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>

        <Show when={selectedYear()}>
          <Select
            value={selectedDepartmentOption()}
            onChange={handleDepartmentChange}
            options={departmentOptions()}
            optionValue="value"
            placeholder="学類"
            itemComponent={(selectProps) => (
              <SelectItem item={selectProps.item}>{selectProps.item.rawValue.label}</SelectItem>
            )}
          >
            <SelectTrigger class="w-40">
              <SelectValue<DepartmentOption>>
                {(state) => state.selectedOption()?.label || "学類"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </Show>

        <Show when={selectedDepartment() && showMajorSelect()}>
          <Select
            value={selectedMajorOption()}
            onChange={handleMajorChange}
            options={majorOptions()}
            optionValue="value"
            placeholder="専攻"
            itemComponent={(selectProps) => (
              <SelectItem item={selectProps.item}>{selectProps.item.rawValue.label}</SelectItem>
            )}
          >
            <SelectTrigger class="w-64">
              <SelectValue<MajorOption>>
                {(state) => state.selectedOption()?.label || "専攻"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </Show>
      </div>
    </Show>
  );
};
