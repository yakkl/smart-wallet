<script lang="ts">
  interface Props {
    onPrevious: () => void;
    onNext: () => void;
  }

  export let onPrevious: Props['onPrevious'];
  export let onNext: Props['onNext'];
</script>

<div class="flex justify-between items-center w-full h-full">
  <button
    class="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-300 p-2 rounded-full shadow-lg hover:bg-gray-400"
    onclick={onPrevious}
    aria-label="Previous"
  >
    &#x2190;
  </button>
  <button
    class="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-300 p-2 rounded-full shadow-lg hover:bg-gray-400"
    onclick={onNext}
    aria-label="Next"
  >
    &#x2192;
  </button>
</div>
