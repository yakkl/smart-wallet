<script lang="ts">
  import '../theme.postcss';
  import '../app.css';

  let { children } = $props();
</script>

<!-- Ensure the slot is correctly rendered -->
{@render children()}
