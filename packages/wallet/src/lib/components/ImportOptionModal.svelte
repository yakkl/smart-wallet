<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import ImportOption from '$lib/components/ImportOption.svelte';

  interface Props {
    show?: boolean;
    showImportWatch?: boolean;
    onCancel?: () => void;
    onClose?: () => void;
    onImportKey?: () => void;
    onImportPhrase?: () => void;
    onImportWatch?: () => void;
    onRestore?: () => void;
  }

  let {
    show = $bindable(false),
    showImportWatch = false,
    onCancel = $bindable(() => {show = false}),
    onClose = $bindable(() => {show = false}),
    onImportKey = () => {show = false},
    onImportPhrase = () => {show = false},
    onImportWatch = () => {show = false},
    onRestore = () => {show = false}
  }: Props = $props();

</script>

<Modal
  bind:show={show}
  onCancel={onCancel}
  onClose={onClose}
  title='Import or Restore Wallet'
>
  <ImportOption showImportWatch={showImportWatch} {onImportKey} {onImportPhrase} {onImportWatch} {onRestore} />
</Modal>
