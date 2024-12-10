<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import RegistrationOption from '$lib/components/RegistrationOption.svelte';

  interface Props {
    show?: boolean;
    onCancel?: () => void;
    onClose?: () => void;
    onCreate: () => void;
    onImport: () => void;
    onRestore: () => void;
  }

  let {
    show = $bindable(false),
    onCancel = $bindable(() => {show = false}),
    onClose = $bindable(() => {show = false}),
    onCreate,
    onImport,
    onRestore
  }: Props = $props();

</script>

<Modal
  bind:show={show}
  onCancel={onCancel}
  onClose={onClose}
  title='Registration'
>
  <RegistrationOption {onCreate} {onImport} {onRestore} title='Options'/>
</Modal>
