<script lang="ts">
  interface Props {
    className?: string;
  }

  let { className = 'h-6 w-6 rounded-full' }: Props = $props();

</script>

<div>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" class="{className}">
    <circle cx="512" cy="512" r="512" fill="#0052FF" />
    <path d="M512 704c53 0 96-43 96-96s-43-96-96-96-96 43-96 96 43 96 96 96zm0-192c53 0 96-43 96-96s-43-96-96-96-96 43-96 96 43 96 96 96z" fill="#fff"/>
  </svg>
</div>
