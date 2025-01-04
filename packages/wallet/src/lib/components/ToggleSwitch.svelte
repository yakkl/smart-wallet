<script lang="ts">
  import Switch from "./ui/switch/switch.svelte";

  interface Props {
    value: boolean;
    labelOn: string;
    labelOff: string;
    disabled?: boolean;
    onChange: (value: boolean) => void; // Callback for value change
    [key: string]: any;
  }

  let { value, labelOn = 'USD', labelOff = 'Token', disabled = false, onChange, ...rest }: Props = $props();

  // Create a reactive state for `value`
  let checked = $state(value);

  // Watch for changes in `checked` and call onChange
  $effect(() => {
    if (!disabled) {
      onChange(checked);
    }
  });
</script>

<div class="flex items-center">
  <span class="mr-2 text-sm w-10">{checked ? labelOn : labelOff}</span>
  <Switch
    class="peer inline-flex h-6 w-10 cursor-pointer items-center rounded-full border-2 border-purple-600 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    bind:checked={checked}
    disabled={disabled}
  />
</div>




  <!-- The default values for the thumb control is: "bg-background pointer-events-none block size-5 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" -->
  <!-- We changed it to: bg-slate-500 pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 -->
