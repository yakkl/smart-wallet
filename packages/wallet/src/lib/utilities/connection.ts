import { yakklConnectionStore } from "$lib/common/stores";
import { isOnline } from '$lib/utilities/utilities';

let connectionIntervalID: string | number | NodeJS.Timeout | undefined=undefined;
let urlCheck: string | undefined;

async function checkConnectionCB() {
  try {
    if (connectionIntervalID) {
      if (await isOnline(urlCheck) !== true) {
        yakklConnectionStore.set(false);
      } else {
        yakklConnectionStore.set(true);
      }
    }
  } catch (e) {
    console.log(e);
  }
}


export function stopCheckConnection() {
  try {
    if (connectionIntervalID && Number(connectionIntervalID) > 0) {
      clearInterval(connectionIntervalID);
      connectionIntervalID = undefined;
    } else {
      connectionIntervalID = undefined;
    }
  } catch(e) {
    console.log(e);
  }
}


export function startCheckConnection(url='https://github.com/yakkl', seconds=30) {
  try {
    if (seconds > 0) {
      urlCheck = url;
      if (connectionIntervalID && Number(connectionIntervalID) > 0) {
        return; // Already running
      }
      connectionIntervalID = setInterval(
        checkConnectionCB,
        1000*seconds);
  }
  } catch (e) {
    console.log(e);
    if (connectionIntervalID && Number(connectionIntervalID) > 0) {
      clearInterval(connectionIntervalID);
      connectionIntervalID = undefined;
    }
  }
}
