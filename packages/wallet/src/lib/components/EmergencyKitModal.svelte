<script lang="ts">
  import Modal from './Modal.svelte';
  import EmergencyKit from './EmergencyKit.svelte';

  export let show = false;
  export let mode: 'import' | 'export' = 'import';
  export let onComplete: (success: boolean, message: string) => void = handleEmergencyKitComplete;
  export let onCancel: () => void = () => {show = false};
  export let onClose: () => void = () => {show = false};

  function handleEmergencyKitComplete(success: boolean, message: string) {
    show = false;
  }
</script>

<Modal bind:show={show} bind:onCancel={onCancel} bind:onClose={onClose} title="Emergency Kit">
  <EmergencyKit mode={mode} onComplete={onComplete} bind:onCancel={onCancel}/>
</Modal>
