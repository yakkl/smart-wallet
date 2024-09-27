<script lang="ts">
	import { on } from 'events';
	import EmergencyKitModal from './EmergencyKitModal.svelte';
	import ImportOptionModal from './ImportOptionModal.svelte';
	import ImportPhrase from './ImportPhrase.svelte';
	import ImportPrivateKey from './ImportPrivateKey.svelte';
	import ImportWatchAccount from './ImportWatchAccount.svelte';

  export let show = false;
  export let showImportWatch = false;
  export let onCancel: () => void = () => {show = false};
  export let onClose: () => void = () => {show = false};
  export let onComplete: (imported: string) => void = (imported: string) => {show = false};
  export let onImportKey: () => void = () => {show=false; showImportAccount = true};
  export let onImportPhrase: () => void = () => {show=false; showImportPhrase = true};
  export let onImportWatch: () => void = () => {show=false; showImportWatchAccount = true};
  export let onRestore: () => void = () => {show=false; showEmergencyKit = true};

  let showImportWatchAccount = false;
  let showImportAccount = false;
  let showImportPhrase = false;
  let showEmergencyKit = false;

  function onCompleteImportPrivateKey() {
    showImportAccount = false;
    show = false;
    onComplete('Private Key');
  }

  function onCancelImportPrivateKey() {
    showImportAccount = false;
    show = false;
  }

  function onCompleteImportPhrase() {
    showImportPhrase = false;
    show = false;
    onComplete('Secret Phrase');
  }

  function onCancelImportPhrase() {
    showImportPhrase = false;
    show = false;
  }

  function onCompleteImportWatch() {
    showImportPhrase = false;
    show = false;
    onComplete('Secret Phrase');
  }

  function onCancelImportWatch() {
    showImportPhrase = false;
    show = false;
  }

  function onCompleteEmergenyKit() {
    showEmergencyKit = false;
    show = false;
    onComplete('Emergency Kit');
  }

  function onCancelEmergencyKit() {
    showEmergencyKit = false;
    show = false;
  }

</script>

<ImportOptionModal {show} showImportWatch={showImportWatch} {onCancel} {onClose} {onImportKey} {onImportPhrase} {onImportWatch} {onRestore} />

<ImportPrivateKey bind:show={showImportAccount} onComplete={onCompleteImportPrivateKey} onCancel={onCancelImportPrivateKey} />

<ImportPhrase bind:show={showImportPhrase} onComplete={onCompleteImportPhrase} onCancel={onCancelImportPhrase} />

<ImportWatchAccount bind:show={showImportWatchAccount} onComplete={onCompleteImportWatch} onCancel={onCancelImportWatch} />

<EmergencyKitModal bind:show={showEmergencyKit} mode='import' onComplete={onCompleteEmergenyKit} onCancel={onCancelEmergencyKit}/>
