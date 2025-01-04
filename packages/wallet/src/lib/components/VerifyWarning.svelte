<script lang="ts">
import { Button, Modal } from "flowbite-svelte";

	interface Props {
		warning?: boolean;
		verifyMessage?: string;
		accept?: any; // export let cancel = () => {};
	}

	let { warning = $bindable(false), verifyMessage = 'Are you sure?', accept = () => {} }: Props = $props();



</script>

<Modal id="warning" bind:open={warning}>
	<div class="text-center break-all">
		<svg
			aria-hidden="true"
			class="mx-auto mb-4 w-14 h-14 text-gray-400 dark:text-gray-200"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
			<span class="font-bold text-red-600">WARNING -</span>
			{verifyMessage}
		</h3>

    <!-- TBD - Have tp change so it gets verified sent off-->
		<Button color="red" on:click={() => {accept}}>OK</Button>
		<!-- <Button on:click={() => {cancel}} color="alternative">No, cancel</Button> -->
	</div>
</Modal>
