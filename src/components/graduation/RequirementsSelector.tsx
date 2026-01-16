import { Component, createSignal, onMount, For, Show } from 'solid-js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select';
import { getAllRequirements } from '~/lib/db/requirements';
import { updateSelectedRequirements } from '~/lib/db/profiles';
import type { GraduationRequirements } from '~/lib/types';

interface RequirementsSelectorProps {
  profileId: string;
  selectedRequirementsId?: string;
  onRequirementsChange?: (requirementsId: string) => void;
}

export const RequirementsSelector: Component<RequirementsSelectorProps> = (props) => {
  const [requirements, setRequirements] = createSignal<GraduationRequirements[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);

  onMount(async () => {
    try {
      const allReqs = await getAllRequirements();
      setRequirements(allReqs);
    } catch (error) {
      console.error('Failed to load requirements:', error);
    } finally {
      setIsLoading(false);
    }
  });

  const handleChange = async (value: GraduationRequirements | null) => {
    if (!value) return;
    try {
      await updateSelectedRequirements(props.profileId, value.id);
      props.onRequirementsChange?.(value.id);
    } catch (error) {
      console.error('Failed to update selected requirements:', error);
    }
  };

  return (
    <div class="mb-6">
      <Show when={!isLoading()} fallback={<div class="h-10 animate-pulse bg-muted rounded-md" />}>
        <div class="flex items-center gap-3">
          <label class="text-sm font-medium text-foreground whitespace-nowrap">
            卒業要件:
          </label>
          <Select
            value={requirements().find(r => r.id === props.selectedRequirementsId)}
            onChange={handleChange}
            options={requirements()}
            optionValue="id"
            optionTextValue="name"
            placeholder="卒業要件を選択"
            itemComponent={props => (
              <SelectItem item={props.item}>{props.item.rawValue.name}</SelectItem>
            )}
          >
            <SelectTrigger class="w-80">
              <SelectValue<GraduationRequirements>>
                {state => state.selectedOption()?.name || '卒業要件を選択'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </div>
      </Show>
    </div>
  );
};
