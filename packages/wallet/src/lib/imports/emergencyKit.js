
/**
 * @param {any} emergencyData
 */
export function importEmergencyKit(emergencyData) {
  // emergencyData is an array of kits
  // cycle through each kit and import it

  // what about meta data? (settings, etc.)
  if (emergencyData && emergencyData.length) {
    
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    emergencyData.forEach((/** @type {any} */ kit) => {
      console.log('importing kit: ', kit);
      // importKit(kit)
    });

  }
}

