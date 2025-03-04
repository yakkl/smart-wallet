<!-- NumericInput.svelte -->
<script lang="ts">
  const {
    value = '',
    placeholder = '0',
    disabled = false,
    errorClass = '',
    className = '',
    onChange = (value: string) => {},
    onBlur = (value: string) => {}
  } = $props<{
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    errorClass?: string;
    className?: string;
    onChange?: (value: string) => void;
    onBlur?: (value: string) => void;
  }>();

  let inputValue = $state(value || '');

  $effect(() => {
    if (value !== inputValue) {
      inputValue = value;
    }
  });

  function handleInput(e: Event) {
    const value = (e.currentTarget as HTMLInputElement).value;

    // Only basic validation for numbers and decimal
    if (!/^[0-9]*\.?[0-9]*$/.test(value)) {
      return;
    }

    inputValue = value;
    onChange(value);
  }
</script>

<input
  type="text"
  {placeholder}
  {disabled}
  value={inputValue}
  oninput={handleInput}
  onblur={onBlur}
  class="{className} {errorClass}"
/>
