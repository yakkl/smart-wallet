<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import ImportOption from '$lib/components/ImportOption.svelte';

  export let show = false;
  export let showImportWatch = false;
  export let onCancel: () => void = () => {show = false};
  export let onClose: () => void = () => {show = false};
  export let onImportKey: () => void = () => {show = false};
  export let onImportPhrase: () => void = () => {show = false};
  export let onImportWatch: () => void = () => {show = false};
  export let onRestore: () => void = () => {show = false};

</script>

<Modal 
  bind:show={show} 
  bind:onCancel={onCancel}
  bind:onClose={onClose}
  title='Import or Restore Wallet'
>
  <ImportOption showImportWatch={showImportWatch} {onImportKey} {onImportPhrase} {onImportWatch} {onRestore} />
</Modal>
