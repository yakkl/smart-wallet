<script lang="ts">
  import { onMount } from 'svelte';

  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
  import type { Browser } from 'webextension-polyfill';
	import { browserSvelte } from '$lib/utilities/browserSvelte';
	import { handleLockDown } from '$lib/common/handlers';
	import { handleOnMessageForExtension } from '$lib/common/listeners/ui/uiListeners';
  let browser_ext: Browser;
  if (browserSvelte) browser_ext = getBrowserExt();

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  onMount(() => {
    // +layout.(ts|svelte) gets removed and the new one loaded for each sub layout so the following code is needed to ensure the listeners are added and removed correctly.
    // We add a remove then an add to make sure we don't have multiple listeners for windows. removeListener will be ignored if it doesn't exist.

    if (browserSvelte && !browser_ext.runtime.onMessage.hasListener(handleOnMessageForExtension)) {
      browser_ext.runtime.onMessage.addListener(handleOnMessageForExtension);
    }
    window.removeEventListener('unload', handleLockDown);
    window.addEventListener('unload', handleLockDown);
    return () => {
      if (browserSvelte && browser_ext.runtime.onMessage.hasListener(handleOnMessageForExtension)) {
        browser_ext.runtime.onMessage.removeListener(handleOnMessageForExtension);
      }
      window.removeEventListener('unload', handleLockDown);
    };
  });
</script>

<!--visible relative  border-b border-gray-300 inset-x-0 top-0 -->
<!-- bg-[url('/images/imagebar.png')] style="background-image: url('/images/imagebar.png');"> -->
<!-- shadow-lg hover:shadow-xl img-background bg-center -->
<div class="print:hidden bg-base-100  m-2 rounded-xl border border-gray-900 overflow-hidden">
  {@render children?.()}
</div>

<!-- <style>
.img-background {
  position: relative;
}

.img-background::before {
  content: "";
  background-image: url('/images/imagebar.png');
  background-size: cover;
  background-position: center;
  position: absolute;
  height: 225px;
  width: 100%;
  top: 0px;
  left: 0px;
  opacity: 0.3;
}
</style> -->
