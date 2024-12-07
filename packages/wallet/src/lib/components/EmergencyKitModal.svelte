<script lang="ts">
  import Modal from './Modal.svelte';
  import EmergencyKit from './EmergencyKit.svelte';

  interface Props {
    show?: boolean;
    mode?: 'import' | 'export';
    onComplete?: (success: boolean, message: string) => void;
    onCancel?: () => void;
    onClose?: () => void;
  }

  let {
    show = $bindable(false),
    mode = 'import',
    onComplete = handleEmergencyKitComplete,
    onCancel = $bindable(() => {show = false}),
    onClose = $bindable(() => {show = false})
  }: Props = $props();

  function handleEmergencyKitComplete(success: boolean, message: string) {
    show = false;
  }
</script>

<Modal bind:show={show} bind:onCancel={onCancel} bind:onClose={onClose} title="Emergency Kit">
  <EmergencyKit mode={mode} onComplete={onComplete} bind:onCancel={onCancel}/>
</Modal>
