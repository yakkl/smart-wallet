/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @param {any} emergencyData
 */
export function importEmergencyKitTEST(emergencyData: any) {
  // emergencyData is an array of kits
  // cycle through each kit and import it

  // what about meta data? (settings, etc.)
  if (emergencyData && emergencyData.length) {

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    emergencyData.forEach((/** @type {any} */ kit: any) => {
      console.log('importing kit: ', kit);
      // importKit(kit)
    });

  }
}

