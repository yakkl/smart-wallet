import { debug_log } from "$lib/common/debug-error";
import { requestsExternal } from "$lib/common/listeners/background/portListeners";
import { log } from "$lib/plugins/Logger";


export async function onDappListener(event: any, sender: any): Promise<void> {
  try {

    debug_log('yakkl - background - onDappListener', event, sender);

    switch(event?.method) {
      case 'get_warning':
        if (Number(event?.id) >= 0) {
          const data = requestsExternal.get(Number(event.id).toString());
          if (data) {
            sender.postMessage({method: 'get_warning', data: data});
          } else {
            // post a message to close the popup
            // send to content.ts an error!!
          }
        } else {
          throw 'No id is present - rejected';
        }
        break;
      case 'get_params':
        if (Number(event?.id) >= 0) {
          const data = requestsExternal.get(Number(event.id).toString());
          if (data) {
            sender.postMessage({method: 'get_params', data: data});
          } else {
            sender.postMessage({method: 'reject'});
          }
        } else {
          throw 'No id is present - rejected';
        }
        break;
      case 'error':
        {
          const data = requestsExternal.get(Number(event.id).toString());
          if (data) {
            const requestData = data.data;
            const sender = (requestData as { sender: any }).sender;
            if (sender) {
              sender.postMessage({id: event.id, method: event.method, type: 'YAKKL_RESPONSE', data: event.response.data});
            }
          }
        }
        break;
      default: // Relays to content.ts
        {
          const data = requestsExternal.get(Number(event.id).toString());

          if (data) {
            const requestData = data.data;
            const sender = (requestData as { sender: any }).sender;
            if (sender) {
              sender.postMessage(event);
            } else {
              throw 'Connection to port has been disconnected - rejected';
            }
          } else {
            throw 'No data is present - rejected';
          }
        }
        break;
    }

  } catch (error) {
    log.error(error);
    sender.postMessage({id: event.id, method: event.method, type: 'YAKKL_RESPONSE', data: {code: -1, message: error}});
  }
}


