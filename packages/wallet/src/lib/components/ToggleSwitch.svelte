<script lang="ts">
	import Switch from "./ui/switch/switch.svelte";


  interface Props {
    value: boolean;
    labelOn: string;
    labelOff: string;
    disabled?: boolean;
    onChange: (value: boolean) => void; // Use a callback function for the change event
    [key: string]: any;
  }

  let { value, labelOn = 'USD', labelOff = 'Token', disabled = false, onChange, ...rest }: Props = $props();

  function toggle() {
    if (!disabled) {
      value = !value;
      onChange(value); // Call the provided onChange handler
    }
  }
</script>

<div class="flex items-center">
  <span class="mr-2 text-sm">{value ? labelOn : labelOff}</span>
  <Switch
    class="peer inline-flex h-6 w-10 cursor-pointer items-center rounded-full border-2 border-purple-600 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    checked={value}
    disabled={disabled}
    on:click={toggle}
    on:keydown={toggle} />
</div>
