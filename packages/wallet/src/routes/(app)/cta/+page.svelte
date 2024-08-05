<script lang="ts">
  import CtaPopup from "$lib/components/CtaPopup.svelte";

  let label = "Upgrade!";
  let description = "Obtain higher security and more!";
  let buttonText = "Upgrade";

</script>


<CtaPopup>
  <div class="z-30 max-w-xl flex flex-col gap-4 p-6">

    <h3 class="font-bold text-4xl md:text-6xl text-center">{label}</h3>
    <div class="text-xl md:text-2xl text-center">{description}</div>

    <div class="text-center">
      <button class="btn">{buttonText}</button>
    </div>

  </div> 
</CtaPopup>
