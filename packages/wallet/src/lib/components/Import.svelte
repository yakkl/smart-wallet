<script lang="ts">
	import EmergencyKitModal from './EmergencyKitModal.svelte';
	import ImportOptionModal from './ImportOptionModal.svelte';
	import ImportPhrase from './ImportPhrase.svelte';
	import ImportPrivateKey from './ImportPrivateKey.svelte';
	import ImportWatchAccount from './ImportWatchAccount.svelte';

  interface Props {
    show?: boolean;
    showImportWatch?: boolean;
    onCancel?: () => void;
    onClose?: () => void;
    onComplete?: (imported: string) => void;
    onImportKey?: () => void;
    onImportPhrase?: () => void;
    onImportWatch?: () => void;
    onRestore?: () => void;
  }

  let {
    show = $bindable(false),
    showImportWatch = false,
    onCancel = () => {show = false},
    onClose = () => {show = false},
    onComplete = (imported: string) => {show = false},
    onImportKey = () => {show=false; showImportAccount = true},
    onImportPhrase = () => {show=false; showImportPhrase = true},
    onImportWatch = () => {show=false; showImportWatchAccount = true},
    onRestore = () => {show=false; showEmergencyKit = true}
  }: Props = $props();

  let showImportWatchAccount = $state(false);
  let showImportAccount = $state(false);
  let showImportPhrase = $state(false);
  let showEmergencyKit = $state(false);

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
