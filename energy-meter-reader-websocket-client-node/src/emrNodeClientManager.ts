import { EMRWebsocketClientManager } from "energy-meter-reader-websocket-client";
import { w3cwebsocket } from "websocket";

export class EMRNodeWebsocketClient extends EMRWebsocketClientManager {
    private ws: w3cwebsocket;

    protected isConnectionOpen(): boolean {
        return this.ws.readyState == WebSocket.OPEN;
    }

    protected isConnectionClosed(): boolean {
        return this.ws.readyState == WebSocket.CLOSED;
    }

    protected openConnection(address: string): void {
        this.ws = new w3cwebsocket(this.address);

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

    protected closeConnection(): void {
        this.ws.close();
    }
    
    protected sendMessage(data: string): void {
        this.ws.send(data);
    }
}