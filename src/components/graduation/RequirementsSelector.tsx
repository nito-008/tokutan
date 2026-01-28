import { type Component, createEffect, createSignal, onMount, Show } from "solid-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { updateSelectedRequirements } from "~/lib/db/profiles";
import { getAllRequirements } from "~/lib/db/requirements";
import { getRequirementLabel } from "~/lib/requirements/label";
import { useAppState, useAppStateActions } from "~/stores/appState";
import type { GraduationRequirements } from "~/types";

export const RequirementsSelector: Component = () => {
  const appState = useAppState();
  const { updateRequirements, updateProfile } = useAppStateActions();
  const [requirements, setRequirements] = createSignal<GraduationRequirements[]>([]);
  const [selectedReq, setSelectedReq] = createSignal<GraduationRequirements | undefined>();
  const [isLoading, setIsLoading] = createSignal(true);

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
    setSelectedReq(appState()?.requirements ?? undefined);
  });

  const handleChange = async (value: GraduationRequirements | null) => {
    if (!value) return;
    const profile = appState()?.profile;
    if (!profile) return;
    setSelectedReq(value);
    try {
      await updateSelectedRequirements(profile.id, value.id);
      updateProfile((current) => ({ ...current, selectedRequirementsId: value.id }));
      updateRequirements(value);
    } catch (error) {
      console.error("Failed to update selected requirements:", error);
    }
  };

  return (
    <Show when={!isLoading()} fallback={<div class="h-10 animate-pulse bg-muted rounded-md" />}>
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-foreground whitespace-nowrap">卒業要件:</span>
        <Select
          value={selectedReq()}
          onChange={handleChange}
          options={requirements()}
          optionValue="id"
          placeholder="卒業要件を選択"
          itemComponent={(selectProps) => (
            <SelectItem item={selectProps.item}>
              {getRequirementLabel(selectProps.item.rawValue)}
            </SelectItem>
          )}
        >
          <SelectTrigger>
            <SelectValue<GraduationRequirements>>
              {(state) => getRequirementLabel(state.selectedOption()) || "卒業要件を選択"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </div>
    </Show>
  );
};
