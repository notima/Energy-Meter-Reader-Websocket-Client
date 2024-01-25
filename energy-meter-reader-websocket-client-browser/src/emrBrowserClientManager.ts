import { EMRWebsocketClientManager } from "../../energy-meter-reader-websocket-client-abstract/dist/emrClientManager";

export let emrBrowserWebsocketClientSingleton: EMRBrowserWebsocketClient;

export class EMRBrowserWebsocketClient extends EMRWebsocketClientManager {
    private ws: WebSocket;

    constructor(address: string, onOpen: {():void}, onClose: {():void}) {
        super(address, onOpen, onClose);
        emrBrowserWebsocketClientSingleton = this;
    }

    protected isConnectionOpen(): boolean {
        return this.ws.readyState == WebSocket.OPEN;
    }

    protected isConnectionClosed(): boolean {
        return this.ws.readyState == WebSocket.CLOSED;
    }

    protected openConnection(address: string): void {
        this.ws = new WebSocket(this.address);

        this.ws.onopen = (ev) => {
            this.onConnectionOpen();
        }

        this.ws.onclose = (ev) => {
            this.onConnectionClose();
        }

        this.ws.onmessage = (ev) => {
            this.onConnectionMessage(ev.data);
        }
    }

    protected closeConnection(): void {
        this.ws.close();
    }
    
    protected sendMessage(data: string): void {
        this.ws.send(data);
    }
}