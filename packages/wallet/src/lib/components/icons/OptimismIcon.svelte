<script lang="ts">

  interface Props {
    className?: string;
  }

  let { className = 'h-6 w-6 rounded-full' }: Props = $props();

</script>

<div>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" class="{className}">
    <circle cx="600" cy="600" r="600" fill="#FF0420" />
    <path d="M498 787h105l63-326h-106l-62 326zm7-160c7-38 26-56 59-56h1c31 0 44 19 37 55l-13 70c-7 38-26 57-59 57h-1c-31 0-44-19-37-55l13-71zm286 24c15-75-30-126-116-126h-60l-39 206h61c84 0 138-46 154-123zm-155 60l12-65c9-47 35-61 64-61h2c32 0 55 15 47 61l-11 65c-9 48-35 62-65 62h-1c-32 0-55-15-48-62z" fill="#fff"/>
  </svg>
</div>  
