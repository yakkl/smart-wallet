<script lang="ts">

  interface Props {
    className?: string;
  }

  let { className = 'h-6 w-6 rounded-full' }: Props = $props();

</script>

<div>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 417" class="{className}">
    <g fill="none">
      <polygon fill="#343434" points="127.9,0 127.9,134.6 255.8,209.7" />
      <polygon fill="#8C8C8C" points="127.9,0 0,209.7 127.9,134.6" />
      <polygon fill="#3C3C3B" points="127.9,277.4 127.9,416.9 255.9,231.1" />
      <polygon fill="#8C8C8C" points="127.9,416.9 127.9,277.4 0,231.1" />
      <polygon fill="#141414" points="127.9,263.1 255.8,209.7 127.9,134.6" />
      <polygon fill="#393939" points="0,209.7 127.9,263.1 127.9,134.6" />
    </g>
  </svg>  
</div>
