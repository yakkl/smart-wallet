<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import RegistrationOption from '$lib/components/RegistrationOption.svelte';

  interface Props {
    show?: boolean;
    onCancel?: () => void;
    onClose?: () => void;
    onCreate: () => void;
    onImport?: () => void;  // NOTE: This is for the RegistrationOptionModal component. The RegistrationOption is only for the RegistrationOptionModal component. Restore requires a valid account to be created first. So, removed restore from here for now.
    onRestore?: () => void; // NOTE: RegistrationOption below does not have onImport nor onRestore.
  }

  let {
    show = $bindable(false),
    onCancel = $bindable(() => {show = false}),
    onClose = $bindable(() => {show = false}),
    onCreate,
    onImport,
    onRestore
  }: Props = $props();

  // NOTE: This is for the RegistrationOptionModal component. The RegistrationOption is only for the RegistrationOptionModal component. Restore requires a valid account to be created first. So, removed restore from here for now.
</script>

<Modal
  bind:show={show}
  onCancel={onCancel}
  onClose={onClose}
  title='Registration'
>
  <RegistrationOption {onCreate} title='Options'/>
</Modal>
