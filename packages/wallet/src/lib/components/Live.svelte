<script lang="ts">
  import { handleOpenInTab } from "$lib/utilities";

  interface Props {
    defaultClass?: string;
    name?: string;
  }

  let { defaultClass = "", name = "LIVE" }: Props = $props();

  function handleLive(_e: any) {

    // DO SOMETHING ELSE HERE...
    handleOpenInTab('https://yakkl.com/university/support?utm_source=yakkl&utm_medium=extension&utm_campaign=live&utm_content=extension&utm_term=extension');
  }


</script>

<button class="btn btn-primary bg-red-700 btn-xs {defaultClass}" onclick={handleLive}>
  <div class="justify-center">
    <div class="text-center">
      <p class="font-extrabold text-md text-white">{name}</p>
    </div>
  </div>
</button>
