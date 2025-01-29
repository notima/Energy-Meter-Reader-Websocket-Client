import { EMRWebsocketClientManager } from "energy-meter-reader-websocket-client";

export let emrBrowserWebsocketClientSingleton: EMRBrowserWebsocketClient;

export class EMRBrowserWebsocketClient extends EMRWebsocketClientManager {
    private ws: WebSocket;
    private pingIntervalId;
    private gracePeriodTimeoutId;

    constructor(address: string, onOpen: {():void}, onClose: {():void}) {
        super(address, onOpen, onClose);
        emrBrowserWebsocketClientSingleton = this;
    }

    public isConnectionOpen(): boolean {
        return this.ws.readyState == WebSocket.OPEN;
    }

    public isConnectionClosed(): boolean {
        return this.ws.readyState == WebSocket.CLOSED;
    }

    public openConnection(address: string): void {
        this.ws = new WebSocket(address);

        this.ws.onopen = (ev) => {
            this.startPingInterval();
            this.onConnectionOpen();
        }

        this.ws.onclose = (ev) => {
            this.onConnectionClose();
        }

        this.ws.onmessage = (ev) => {
            if(ev.data == "pong") {
                clearTimeout(this.gracePeriodTimeoutId);
            } else {
                this.onConnectionMessage(ev.data);
            }
        }
    }

    public closeConnection(): void {
        this.ws.close();
    }

    private terminateConnection(): void {
        this.closeConnection();
        this.ws.onclose = this.ws.onerror = this.ws.onmessage = null;
        this.onConnectionClose();
    }
    
    public sendMessage(data: string): void {
        this.ws.send(data);
    }

    private startPingInterval() {
        clearInterval(this.pingIntervalId);
        this.pingIntervalId = setInterval(() => {
            if(this.ws.readyState == this.ws.OPEN) {
                this.ws.send("ping");
                this.gracePeriodTimeoutId = setTimeout(() => {
                    console.log("Websocket timeout");
                    this.terminateConnection();
                }, 1000);
            }
        }, 3000);
    }
}