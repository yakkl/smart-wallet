

<!-- <script lang="ts">
 import * as Tooltip from "$lib/components/ui/tooltip/index.js";

 export interface Props {
    triggerText?: string; // Text or element for the tooltip trigger
    contentText?: string; // Text or element for the tooltip content
    placement?: "top" | "bottom" | "left" | "right"; // Tooltip placement (default: bottom)
    delay?: number; // Delay in showing the tooltip (default: 0)
    triggerClass?: string; // Optional classes for trigger styling
    contentClass?: string; // Optional classes for content styling
  }

  let {
    triggerText = "Hover",
    contentText = "Tooltip Content",
    placement = "bottom",
    delay = 0,
    triggerClass = "px-2 py-1 bg-gray-300 text-gray-800 rounded",
    contentClass = "p-2 bg-gray-800 text-white rounded shadow-md",
  }: Props = $props();

</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger class={triggerClass}>
      {triggerText}
    </Tooltip.Trigger>
    <Tooltip.Content class={contentClass} side={placement} sideOffset={5}  >
      {contentText}
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
 -->
