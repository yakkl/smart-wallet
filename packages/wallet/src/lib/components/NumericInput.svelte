<!-- NumericInput.svelte -->
<script lang="ts">
  import { debounce } from 'lodash-es';

  const {
    value = '',
    placeholder = '0',
    maxDecimals = 18,
    disabled = false,
    errorClass = '',
    className = '',
    isUsdMode = false,
    onChange = (value: string) => {},
    onBlur = (value: string) => {}
  } = $props<{
    value?: string;
    placeholder?: string;
    maxDecimals?: number;
    disabled?: boolean;
    errorClass?: string;
    className?: string;
    isUsdMode?: boolean;
    onChange?: (value: string) => void;
    onBlur?: (value: string) => void;
  }>();

  let inputValue = $state(value || '');
  let previousValue = $state(value || '');

  // Debounced change handler
  const debouncedChange = debounce((value: string) => {
    onChange(value);
  }, 300);

  // Sync with external value
  $effect(() => {
    if (value !== inputValue && value !== previousValue) {
      inputValue = value;
      previousValue = value;
    }
  });

  function isValidNumericInput(value: string): boolean {
    // Allow empty string, numbers, single decimal point, and leading/trailing zeros
    return /^$|^[0-9]*\.?[0-9]*$/.test(value);
  }

  function formatDecimals(value: string, decimals: number): string {
    if (!value.includes('.')) return value;

    const [whole, fraction] = value.split('.');
    return `${whole}.${fraction.slice(0, decimals)}`;
  }

  function normalizeValue(value: string): string {
    // Handle empty or invalid input
    if (!value || value === '.') return '';

    // Add leading zero for decimal values
    if (value.startsWith('.')) {
      value = `0${value}`;
    }

    // Remove multiple decimal points
    const parts = value.split('.');
    if (parts.length > 2) {
      value = `${parts[0]}.${parts.slice(1).join('')}`;
    }

    // Apply decimal precision
    const effectiveDecimals = isUsdMode ? 2 : maxDecimals;
    return formatDecimals(value, effectiveDecimals);
  }

  function handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let newValue = input.value;

    // Only proceed if input is valid
    if (!isValidNumericInput(newValue)) {
      input.value = inputValue;
      return;
    }

    // Normalize the value
    newValue = normalizeValue(newValue);

    // Update local state
    inputValue = newValue;
    previousValue = newValue;

    // Notify parent
    debouncedChange(newValue);
  }

  function handleBlur() {
    const normalizedValue = normalizeValue(inputValue);
    inputValue = normalizedValue;
    previousValue = normalizedValue;
    onBlur(normalizedValue);
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Allow: backspace, delete, tab, escape, enter, decimal point
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', '.', '-'];

    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (
      (event.ctrlKey === true && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) ||
      allowedKeys.includes(event.key) ||
      // Allow: home, end, left, right
      (['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(event.key))
    ) {
      return;
    }

    // Ensure that it is a number and stop the keypress
    if (
      (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) &&
      (event.keyCode < 96 || event.keyCode > 105)
    ) {
      event.preventDefault();
    }
  }
</script>

<input
  type="text"
  {placeholder}
  {disabled}
  value={inputValue}
  oninput={handleInput}
  onblur={handleBlur}
  onkeydown={handleKeyDown}
  class="{className} {errorClass}"
/>
