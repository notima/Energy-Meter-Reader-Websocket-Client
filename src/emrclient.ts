import { EMRDataPoint } from "./emrdata";
import { EMRStatus } from "./emrstatus";

export let wsSingleton: EMRWebsocketClient;

export const DATA_KEY = "data"
export const STATUS_KEY = "status"
export const LOG_KEY = "log"

interface Subscriber {
    key: string;
    callback: {(data:any): void};
}

interface ConnectionConfig {
    statusUpdate: boolean;
    dataUpdate: boolean;
    log: boolean;
}

export class EMRWebsocketClient {
    private ws: WebSocket;
    private subscribers: Subscriber[] = [];
    private lastMessage: number
    private address: string;
    private config: ConnectionConfig = {} as ConnectionConfig;

    constructor(address: string, onOpen: {(ev: Event):void}, onClose: {(ev: Event):void}) {
        this.address = address;
        this.openWS(onOpen, onClose);

        wsSingleton = this;

        setInterval(()=>{
            console.log("WS state:",this.ws.readyState);
            if(this.ws.readyState == WebSocket.OPEN && this.lastMessage + 10000 < Date.now()) {
                console.log("Websocket timeout");
                this.ws.close();
                onClose(null);
                this.openWS(onOpen, onClose);
            }
            else if(this.ws.readyState == WebSocket.CLOSED) {
                console.log("Attempting reconnect...");
                this.openWS(onOpen, onClose);
            }
        },5000);
    }

    private openWS(onOpen: {(ev: Event):void}, onClose: {(ev: Event):void}) {
        this.ws = new WebSocket(this.address);

        this.ws.onopen = (ev: Event) => {
            this.syncConnectionConfig();
            onOpen(ev);
        };
        this.ws.onclose = (ev: Event) => {
            onClose(ev);
            this.openWS(onOpen, onClose);
        };
    
        this.ws.onmessage = (ev: MessageEvent) => {
            this.lastMessage = Date.now();
            let message = JSON.parse(ev.data);
            this.subscribers.forEach(subscriber => {
                if(message.hasOwnProperty(subscriber.key)) {
                    subscriber.callback(message[subscriber.key]);
                }
            });
        }
    }

    public addStatusHandler(callback: {(data:EMRStatus): void}) {
        this.subscribe(STATUS_KEY, callback);
        if(!this.config.statusUpdate) {
            this.config.statusUpdate = true;
            this.syncConnectionConfig();
        }
    }

    public addDataHandler(callback: {(data:EMRDataPoint): void}) {
        this.subscribe(DATA_KEY, callback);
        if(!this.config.dataUpdate) {
            this.config.dataUpdate = true;
            this.syncConnectionConfig();
        }
    }

    public addLogHandler(callback: {(data:string): void}) {
        this.subscribe(LOG_KEY, callback);
        if(!this.config.log) {
            this.config.log = true;
            this.syncConnectionConfig();
        }
    }

    private syncConnectionConfig() {
        this.send({connection: this.config});
    }

    public subscribe(key: string, callback: {(data:any): void}) {
        this.subscribers.push({
            key: key,
            callback: callback
        } as Subscriber);
    }

    public send(data: any): void {
        if(this.ws.readyState == WebSocket.OPEN)
            this.ws.send(JSON.stringify(data));
    }
}