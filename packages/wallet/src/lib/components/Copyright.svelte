<script lang="ts">
  import { VERSION, YEAR } from '$lib/common/constants';
  import type { Settings } from '$lib/common';
  import { getSettings } from '$lib/common/stores';
  import { onMount } from 'svelte';
  
  interface Props {
    registeredType?: string | null;
  }

  let { registeredType = null }: Props = $props();
  
  /**
   * The registered type retrieved from Yakkl settings.
   * @type {string}
   */
  let registered: string = $state();
  
  onMount(async () => {
    getSettings().then(async (result) => {
      const yakklSettings = result as Settings;
      registered = yakklSettings.registeredType;
    });
  });
  </script>
  
  <div class="inline-block absolute left-0 bottom-2 mx-auto w-full text-center label-text">
    <!-- <a href="https://yakkl.com?utm_source=yakkl" class="text-xs text-primary/50 hover:text-primary/75"> -->
      <span style="font-size: 10px;">YAKKL® ©Copyright {YEAR}, Version: {VERSION} {!registeredType ? registered : registeredType}</span>
    <!-- </a> -->
  </div>
  