import type { Runtime } from 'webextension-polyfill';

type RuntimePort = Runtime.Port;

// Port collections
const portsDapp: RuntimePort[] = [];
const portsInternal: RuntimePort[] = [];
const portsExternal = new Map<number, RuntimePort>();
let mainPort: RuntimePort | undefined;

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
        console.log("Port connection error:", error);
    }
}

export function onDisconnect(port: RuntimePort) {
    if (mainPort === port) mainPort = undefined;
    // Remove from other collections as necessary
    console.log(`Port ${port.name} disconnected.`);
}

export function broadcastToPorts(ports: RuntimePort[], message: any) {
    ports.forEach(port => port.postMessage(message));
}

// Exports
export { mainPort, portsDapp, portsInternal, portsExternal };
