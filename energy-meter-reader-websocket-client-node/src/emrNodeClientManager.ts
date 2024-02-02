import { EMRWebsocketClientManager } from "energy-meter-reader-websocket-client";
import { w3cwebsocket } from "websocket";

export class EMRNodeWebsocketClient extends EMRWebsocketClientManager {
    
    private ws: w3cwebsocket;

    public isConnectionOpen(): boolean {
        return this.ws && this.ws.readyState == w3cwebsocket.OPEN;
    }

    public isConnectionClosed(): boolean {
        return this.ws == null || this.ws.readyState == w3cwebsocket.CLOSED;
    }

    public openConnection(address: string): void {
        if(!this.isConnectionClosed) {
            return;
        }
        this.ws = new w3cwebsocket(address, undefined, undefined, undefined, undefined, {closeTimeout: 500, keepalive: true, dropConnectionOnKeepaliveTimeout: true, keepaliveGracePeriod : 1000, keepaliveInterval: 3000} as any);

        this.ws.onopen = () => {
            this.onConnectionOpen();
        }

        this.ws.onclose = (ev) => {
            this.onConnectionClose();
        }

        this.ws.onmessage = (msg) => {
            this.onConnectionMessage(msg.data as string);
        }
    }

    public closeConnection(): void {
        this.ws.close();
    }
    
    protected sendMessage(data: string): void {
        this.ws.send(data);
    }
}