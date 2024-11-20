<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import RegistrationOption from '$lib/components/RegistrationOption.svelte';

  export let show = false;
  export let onCancel: () => void = () => {show = false};
  export let onClose: () => void = () => {show = false};
  export let onCreate: () => void;
  export let onImport: () => void;
  export let onRestore: () => void;

</script>

<Modal 
  bind:show={show} 
  bind:onCancel={onCancel}
  bind:onClose={onClose}
  title='Registration'
>
  <RegistrationOption {onCreate} {onImport} {onRestore} title='Options'/>
</Modal>
