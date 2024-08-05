<script lang="ts">
	import { page } from '$app/stores';
  console.log('error:', $page);
</script>

<h1>{$page?.status} {$page?.error?.message}</h1>
<span style="font-size: 10em">
	Oops - Error
</span>
