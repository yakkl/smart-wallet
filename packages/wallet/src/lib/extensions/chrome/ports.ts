import type { Browser, Runtime } from 'webextension-polyfill';
import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
import { log } from '$plugins/Logger';

type RuntimePort = Runtime.Port;

// Port collections
const portsDapp: RuntimePort[] = [];
const portsInternal: RuntimePort[] = [];
const portsExternal = new Map<number, RuntimePort>();
let mainPort: RuntimePort | undefined;

export class PortManager {
  private port: Runtime.Port | undefined;
  private name: string;
  private browser_ext: Browser = getBrowserExt();

  constructor(name: string) {
    this.name = name;
  }

  createPort() {
    if (this.port) return true;
    if (!this.browser_ext) return false;

    try {
      this.port = this.browser_ext.runtime.connect({ name: this.name });
      this.port.onMessage.addListener(this.onMessageListener);
      this.port.onDisconnect.addListener(this.onDisconnectListener.bind(this));
      return true;
    } catch (error) {
      log.error("Failed to create port:", error);
      return false;
    }
  }

  private onMessageListener(response: any) {
    try {
      if (response.type === 'YAKKL_RESPONSE') {
        window.postMessage(response, window.location.origin);
      }
    } catch (error) {
      log.error("Error processing message:", error);
      window.postMessage(
        { id: response.id, method: response.method, error, type: 'YAKKL_RESPONSE' },
        window.location.origin
      );
    }
  }

  private onDisconnectListener() {
    log.info("Port disconnected.");
    if (this.port) {
      this.port.onMessage.removeListener(this.onMessageListener);
      this.port.onDisconnect.removeListener(this.onDisconnectListener.bind(this));
      this.port = undefined;
    }
    this.createPort(); // Attempt to reconnect
  }

  public getPort() {
    return this.port;
  }

  public getName() {
    return this.name;
  }

}

// Lifecycle Handlers
export function onConnect(port: RuntimePort) {
    try {
        if (!port) throw "Port is undefined.";
        if (port.name === "main") {
            mainPort = port;
        } else if (port.name === "dapp") {
            portsDapp.push(port);
        } else if (port.name === "internal") {
            portsInternal.push(port);
        } else {
            throw `Unsupported port name: ${port.name}`;
        }
        port.onDisconnect.addListener(() => onDisconnect(port));
    } catch (error) {
        log.error("Port connection error:", error);
    }
}

export function onDisconnect(port: RuntimePort) {
    if (mainPort === port) mainPort = undefined;
    // Remove from other collections as necessary
    log.info(`Port ${port.name} disconnected.`);
}

export function broadcastToPorts(ports: RuntimePort[], message: any) {
    ports.forEach(port => port.postMessage(message));
}

// Exports
export { mainPort, portsDapp, portsInternal, portsExternal };
