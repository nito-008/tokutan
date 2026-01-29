import { type Component, createEffect, createSignal } from "solid-js";
import { Input } from "~/components/ui/input";

interface PrefixInputProps {
  prefixes: string[];
  onUpdate: (prefixes: string[]) => void;
}

export const PrefixInput: Component<PrefixInputProps> = (props) => {
  const [localValue, setLocalValue] = createSignal(props.prefixes.join(", "));
  const [isFocused, setIsFocused] = createSignal(false);

  // propsが外部から変更された場合、フォーカスしていなければ同期
  createEffect(() => {
    if (!isFocused()) {
      setLocalValue(props.prefixes.join(", "));
    }
  });

  const handleBlur = () => {
    setIsFocused(false);
    const value = localValue().trim();
    const prefixes = value
      ? value
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p)
      : [""];
    props.onUpdate(prefixes);
  };

  return (
    <Input
      class="h-8"
      value={localValue()}
      onInput={(e) => setLocalValue(e.currentTarget.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      placeholder="科目番号の先頭 (例: FG, FA, GB)"
    />
  );
};
