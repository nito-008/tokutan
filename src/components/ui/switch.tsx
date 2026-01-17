import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import * as SwitchPrimitive from "@kobalte/core/switch";
import type { ValidComponent } from "solid-js";
import { splitProps } from "solid-js";

import { cn } from "~/lib/utils";

type SwitchProps<T extends ValidComponent = "div"> = SwitchPrimitive.SwitchRootProps<T> & {
  class?: string | undefined;
};

const Switch = <T extends ValidComponent = "div">(props: PolymorphicProps<T, SwitchProps<T>>) => {
  const [local, others] = splitProps(props as SwitchProps, ["class", "children"]);
  return (
    <SwitchPrimitive.Root class={cn("inline-flex items-center gap-2", local.class)} {...others}>
      {(state) => (
        <>
          <SwitchPrimitive.Input class="peer" />
          {typeof local.children === "function" ? local.children(state) : local.children}
        </>
      )}
    </SwitchPrimitive.Root>
  );
};

type SwitchControlProps<T extends ValidComponent = "div"> =
  SwitchPrimitive.SwitchControlProps<T> & {
    class?: string | undefined;
  };

const SwitchControl = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, SwitchControlProps<T>>,
) => {
  const [local, others] = splitProps(props as SwitchControlProps, ["class"]);
  const context = SwitchPrimitive.useSwitchContext();
  const unchecked = () => (context.checked() ? undefined : "");
  return (
    <SwitchPrimitive.Control
      class={cn(
        "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[checked]:bg-primary data-[unchecked]:bg-input disabled:cursor-not-allowed disabled:opacity-50",
        local.class,
      )}
      data-unchecked={unchecked()}
      {...others}
    >
      <SwitchPrimitive.Thumb
        class="pointer-events-none block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[checked]:translate-x-5 data-[unchecked]:translate-x-0"
        data-unchecked={unchecked()}
      />
    </SwitchPrimitive.Control>
  );
};

type SwitchLabelProps<T extends ValidComponent = "label"> = SwitchPrimitive.SwitchLabelProps<T> & {
  class?: string | undefined;
};

const SwitchLabel = <T extends ValidComponent = "label">(
  props: PolymorphicProps<T, SwitchLabelProps<T>>,
) => {
  const [local, others] = splitProps(props as SwitchLabelProps, ["class"]);
  return (
    <SwitchPrimitive.Label
      class={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        local.class,
      )}
      {...others}
    />
  );
};

export { Switch, SwitchControl, SwitchLabel };
