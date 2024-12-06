<script lang="ts">
  export let error: { message: string } = { message: 'Unknown error' }; // Default value
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  export let status: number = 500; // Default HTTP status code
</script>

<h1>{status}: {error?.message}</h1>
<span style="font-size: 10em; color: red;">Ooops - Error</span>
