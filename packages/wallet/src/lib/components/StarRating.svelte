<script lang="ts">
	import { log } from '$lib/plugins/Logger';
  import { handleOpenInTab } from '$lib/utilities/utilities';
  import { Popover } from 'flowbite-svelte';
  interface Props {
    [key: string]: any
  }

  let { ...rest }: Props = $props();

  async function handleShare(event: MouseEvent): Promise<any> {
    const id = (event.currentTarget as HTMLElement).dataset.id;
    if (!id) {
      log.error('No ID found');
      return;
    }
    // Popup share button for twitter, fb, linkedin, reddit
    let message;
    let url: string = '';

    if (id === 'twitter') {
      message = 'Spreading the love! @yakklcrypto YAKKL® Smart Wallet is awesome! Their website is: https://yakkl.com and you can download the Wallet at the Chrome Browser Extension store: ';
      url = encodeURI(`https://twitter.com/intent/tweet?hashtags=crypto,yakkl,bitcoin,ethereum&via=yakklcrypto&original_referer=https://yakkl.com&ref_src=YAKKL&url=https://chrome.google.com/webstore/detail/nlhmgobjaicpkegfdklfgmmdehkmmonl/&text=${message}`);
    } else if (id === 'linkedin') {
      // This will popup the linked window for the user to submit or edit and then submit
      //https://www.linkedin.com/sharing/share-offsite?url=https://yakkl.com/share/<something that we may change on different days or picks randomly>&title=<whatever>
      message = "Can't wait to share the love of YAKKL® Smart Wallet! Their website is: https://yakkl.com and you can download the Wallet at the Chrome Browser Extension store: ";
      url = encodeURI(`https://www.linkedin.com/sharing/share-offsite?url=https://yakkl.com/share/linkedin&title=${message}`);
    }

    handleOpenInTab(url);
  }

</script>

<Popover triggeredBy="#share" placement="bottom-start" class="w-40 text-sm font-normal text-gray-900 bg-white dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800 z-100">
  <div class="p-1">
    <p class="text-sm font-bold text-center text-purple-600">RATE US</p>
    <p class="mb-2 text-sm font-normal text-center">Let us know how we can improve!</p>

    <p class="text-sm font-bold text-center text-purple-600">Love lever :)</p>
    <div class="rating rating-sm">
      <input type="radio" name="rating-6" class="mask mask-star-2 bg-orange-400" />
      <input type="radio" name="rating-6" class="mask mask-star-2 bg-orange-400" />
      <input type="radio" name="rating-6" class="mask mask-star-2 bg-orange-400" />
      <input type="radio" name="rating-6" class="mask mask-star-2 bg-orange-400" />
      <input type="radio" name="rating-6" class="mask mask-star-2 bg-orange-400" checked/>
    </div>
  </div>
</Popover>

<!-- Share -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div id="share" role="button" onclick={handleShare} {...rest}>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7  fill-gray-100 hover:fill-gray-400">
    <path fill-rule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clip-rule="evenodd" />
  </svg>

  <!-- Add comment box and maybe put this in a dialog box -->
</div>
