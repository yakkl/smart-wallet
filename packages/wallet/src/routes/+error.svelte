<script lang="ts">

  interface Props {
    error: { message: string }; // Default value
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    status: number; // Default HTTP status code
  }

  let { error = { message: 'Unknown error' }, status = 500 }: Props = $props();
</script>

<h1>{status}: {error.message}</h1>
