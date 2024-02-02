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
        this.ws = new WebSocket(this.address);

        this.ws.onopen = (ev) => {
            this.startPingInterval();
            this.onConnectionOpen();
        }

        this.ws.onclose = (ev) => {
            clearInterval(this.pingIntervalId);
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
    
    public sendMessage(data: string): void {
        this.ws.send(data);
    }

    private startPingInterval() {
        this.pingIntervalId = setInterval(() => {
            this.ws.send("ping");
            this.gracePeriodTimeoutId = setTimeout(() => {
                console.log("Websocket timeout");
                this.closeConnection();
            }, 1000);
        }, 3000);
    }
}