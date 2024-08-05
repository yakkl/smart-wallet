<script lang="ts">
  import Confirm from "$components/Confirm.svelte";
	import { deepCopy } from "$lib/utilities";
  import { importEmergencyKit } from "$lib/imports/emergencyKit.js";

  export let defaultClass = 'mt-4';
  export let emergencyData = null;
  export let confirmed = false;
  export let processData = true;

  let showConfirm = false;
  let kits: any[] = [];
  let kitData;
  let data;

  // $: console.log('emergencykit--:', emergencyData);

  // function readFile() {  
  //   const fileInput = document.getElementById('fileInput');
  //   const file = fileInput.files[0];
  //   if (!file) {
  //     console.log('No file selected');
  //     return;
  //   }
  //   const reader = new FileReader();

  //   reader.onload = () => {
  //     try {
  //       kits = [];
  //       kitData = JSON.parse(reader.result);

  //       if (kitData) {
  //         if (kitData?.kits?.length > 0) {
  //           kits = kitData.kits;
  //         } else {
  //           kits.push(kitData);
  //         }
  //       } else {
  //         throw 'EmergencyKit - Invalid data format - no kits found';
  //       }

  //       if (kits.length === 0) {
  //         throw 'EmergencyKit - Invalid data format - no kits found';
  //       }

  //       for (let i = 0; i < kits.length; i++) {
  //         data = kits[i];
  //         if (!validateData(data)) {
  //           throw 'EmergencyKit - Invalid data format';
  //         }
  //       }
  //       showConfirm = true;
  //     } catch (e) {
  //       console.log(e);
  //     }
  //   };

  //   reader.onerror = error => {
  //     console.log(`Emergency Kit - Error reading file: ${error}`);
  //   };

  //   reader.readAsText(file);
  // }

  function readFile(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      console.log('No file selected');
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      try {
        let kits: any[] = [];
        let kitData: any;
        const result = reader.result;

        if (typeof result === 'string') {
          kitData = JSON.parse(result);
        } else {
          throw 'EmergencyKit - Invalid data format - result is not a string';
        }

        if (kitData) {
          if (kitData.kits?.length > 0) {
            kits = kitData.kits;
          } else {
            kits.push(kitData);
          }
        } else {
          throw 'EmergencyKit - Invalid data format - no kits found';
        }

        if (kits.length === 0) {
          throw 'EmergencyKit - Invalid data format - no kits found';
        }

        for (const data of kits) {
          if (!validateData(data)) {
            throw 'EmergencyKit - Invalid data format';
          }
        }

        let showConfirm = true;
      } catch (e) {
        console.log(e);
      }
    };

    reader.onerror = error => {
      console.log(`Emergency Kit - Error reading file: ${error}`);
    };

    reader.readAsText(file);
  }


  function validateData(data: any) {
    if (!data?.data) {
      // not encrypted so don't trust it
      throw 'Invalid data format - not encrypted';
    }
    return true;
  }

  function handleConfirm() {
    emergencyData = deepCopy(kits);
    if (processData) {
      importEmergencyKit(emergencyData);
    }
    showConfirm = false;
    confirmed = true;
  }

</script>

<Confirm
  bind:show={showConfirm}
  title="Import Emergency Kit"
  content="Caution! Are you sure you want to import this emergency kit? This will overwrite your existing accounts."
  handleConfirm={() => {handleConfirm()}}
  confirmText="Yes, Import"
  rejectText="No, Cancel"
  />

<div class={defaultClass}>
  <form>
    <input type="file" id="fileInput" accept=".json">
    <button type="button" class="btn btn-primary" on:click={readFile}>Read File</button>
  </form>
</div>
