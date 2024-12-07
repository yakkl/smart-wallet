<script lang="ts">
  interface Props {
    text?: string;
    background?: string;
  }

  let { text = 'Loading...', background = 'bg-current' }: Props = $props();
</script>

<div
  class="inline-block h-8 w-8 animate-[spinner-grow_0.75s_linear_infinite] rounded-full {background} align-[-0.125em] opacity-0 motion-reduce:animate-[spinner-grow_1.5s_linear_infinite]"
  role="status">
  <span
    class="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">{text}
  </span>
</div>
