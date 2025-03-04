<!-- Copy.svelte -->
<script lang="ts">
  import { log } from '$plugins/Logger';
  import { browser_ext } from '$lib/common/environment';
	import { timeoutClipboard } from '$lib/utilities';

  type CopyTarget = {
    id?: string;
    value?: string | number | null | undefined;
    timeout?: number;
    redactText?: string;
  };

  type CopyConfig = CopyTarget | CopyTarget[];

  const {
    target,
    size = 20,
    className = '',
    showFeedback = true,
    feedbackDuration = 2000,
    defaultRedactText = '<redacted>',
    onClick = undefined,
  } = $props<{
    target: CopyConfig;
    size?: number;
    className?: string;
    showFeedback?: boolean;
    feedbackDuration?: number;
    defaultRedactText?: string;
    onClick?: (copiedValue: string) => void;
  }>();

  let isCopied = $state(false);
  let timeoutIds: Map<string, number> = new Map();

  // Add reactive tracking for the target value
  // $effect(() => {
  //   // This ensures we're tracking changes to the target value
  //   if (!Array.isArray(target) && target.value !== undefined) {
  //     log.debug('Current target value:', target.value);
  //   }
  // });

  function getValue(copyTarget: CopyTarget): string {
    if (copyTarget.id) {
      const element = document.getElementById(copyTarget.id);
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        return element.value;
      } else if (element) {
        return element.textContent || '';
      }
      log.warn(`Element with id '${copyTarget.id}' not found`);
      return '';
    }

    // Improved value handling
    const value = copyTarget.value;
    if (value === null || value === undefined) {
      return '';
    }
    return value.toString();
  }

  // Handle single copy target
  async function handleSingleCopy(copyTarget: CopyTarget): Promise<void> {
    const value = getValue(copyTarget);
    await navigator.clipboard.writeText(value);

    // Call onClick handler if provided
    if (onClick) {
      onClick(value);
    }

    // Set redaction timeout if specified
    if (copyTarget.timeout) {
      timeoutClipboard(copyTarget.timeout, copyTarget.redactText || defaultRedactText);

      // Get active tab for script injection
      // try {
        // const [tab] = await browser_ext.tabs.query({ active: true, currentWindow: true });
        // if (tab && tab.id) {
        //   browser_ext.runtime.sendMessage({ type: 'clipboard-timeout', tabId: tab.id, timeout: copyTarget.timeout, redactText: copyTarget.redactText || defaultRedactText });
        // } else {
        //   log.error('Failed to get active tab for clipboard timeout');
        // }
      // } catch (err) {
      //   log.error('Failed to set clipboard timeout:', err);
      // }

      // const timeoutId = setTimeout(async () => {
      //   const redactText = copyTarget.redactText || defaultRedactText;
      //   await navigator.clipboard.writeText(redactText);
      //   timeoutIds.delete(copyTarget.id || value);
      // }, copyTarget.timeout) as unknown as number;

      // timeoutIds.set(copyTarget.id || value, timeoutId);
    }
  }

  // Handle multiple copy targets
  async function handleMultiCopy(copyTargets: CopyTarget[]): Promise<void> {
    const values = copyTargets.map(target => getValue(target));
    const combinedValue = values.join('\n');
    await navigator.clipboard.writeText(combinedValue);

    // Call onClick handler if provided
    if (onClick) {
      onClick(combinedValue);
    }

    // Handle individual timeouts
    copyTargets.forEach((target, index) => {
      if (target.timeout) {
        const timeoutId = setTimeout(async () => {
          const currentValues = [...values];
          const redactText = target.redactText || defaultRedactText;
          currentValues[index] = redactText;
          await navigator.clipboard.writeText(currentValues.join('\n'));
          timeoutIds.delete(target.id || values[index]);
        }, target.timeout) as unknown as number;

        timeoutIds.set(target.id || values[index], timeoutId);
      }
    });
  }

  async function copyToClipboard() {
    try {
      if (Array.isArray(target)) {
        await handleMultiCopy(target);
      } else {
        await handleSingleCopy(target);
      }

      if (showFeedback) {
        isCopied = true;
        setTimeout(() => {
          isCopied = false;
        }, feedbackDuration);
      }
    } catch (err) {
      // log.error('Failed to copy:', err);
      isCopied = false;
    }
  }

  // Cleanup timeouts
  $effect(() => {
    return () => {
      timeoutIds.forEach((id) => clearTimeout(id));
      timeoutIds.clear();
    };
  });
</script>

<button
  type="button"
  onclick={copyToClipboard}
  class="
    inline-flex
    items-center
    justify-center
    transition-all
    duration-200
    ease-in-out
    rounded-md
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
    focus:ring-blue-500
    {className}
  "
  title="Copy to clipboard"
>
  {#if isCopied}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="text-green-500"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
    <span class="sr-only">Copied!</span>
  {:else}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="text-gray-500 hover:text-blue-500 transition-colors duration-200"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
    <span class="sr-only">Copy to clipboard</span>
  {/if}
</button>


<!-- Example usage: -->
<!-- Basic usage -->
<!-- <Copy
  target={{ value: "Simple text to copy" }}
  className="hover:bg-gray-100 p-2"
/> -->

<!-- With custom redaction -->
<!-- <Copy
  target={{
    value: sensitiveData,
    timeout: 30000,
    redactText: "Content removed for security"
  }}
  className="text-gray-600 hover:text-blue-600"
/> -->

<!-- Copy from input with custom styling -->
<!-- <div class="flex items-center space-x-2">
  <input
    id="walletAddress"
    value={address}
    readonly
    class="bg-gray-50 border rounded px-3 py-2"
  />
  <Copy
    target={{ id: "walletAddress" }}
    className="p-1 hover:bg-gray-100 rounded-full"
    size={16}
  />
</div> -->

<!-- Multiple values with different redaction settings -->
<!-- <Copy
  target={[
    {
      value: "Public info",
    },
    {
      value: "Sensitive info",
      timeout: 30000,
      redactText: "REDACTED-SENSITIVE"
    },
    {
      id: "privateKey",
      timeout: 5000,
      redactText: "KEY-REMOVED"
    }
  ]}
  className="bg-blue-50 hover:bg-blue-100 p-2 rounded-lg"
/> -->

<!-- Complex example with different styles -->
<!-- <div class="space-y-4 p-4 bg-white rounded-lg shadow">
  <div class="flex items-center justify-between">
    <input
      id="wallet"
      value={walletAddress}
      readonly
      class="flex-1 bg-gray-50 rounded border px-3 py-2"
    />
    <Copy
      target={{ id: "wallet" }}
      className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-all"
      size={16}
    />
  </div>

  <div class="flex items-center justify-between">
    <input
      id="privateKey"
      value={privateKey}
      type="password"
      class="flex-1 bg-gray-50 rounded border px-3 py-2"
    />
    <Copy
      target={{
        id: "privateKey",
        timeout: 5000,
        redactText: "PRIVATE-KEY-REMOVED"
      }}
      className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-all"
      size={16}
    />
  </div>
</div> -->
