import { EMRDataPoint } from "./emrData";
import { EMRStatus } from "./emrStatus";

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

export abstract class EMRWebsocketClientManager {
    protected subscribers: Subscriber[] = [];
    protected address: string;
    protected config: ConnectionConfig = {} as ConnectionConfig;

    /**
     * Timestamp of last received message from server
     */
    private lastMessage: number;

    // Websocket callback functions
    private onOpen: {():void};
    private onClose: {():void}

    constructor(address: string, onOpen: {():void}, onClose: {():void}) {
        this.address = address;
        this.onOpen = onOpen;
        this.onClose = onClose;
        this.openConnection(address);

        setInterval(()=>{
            if(this.isConnectionOpen() && this.lastMessage + 10000 < Date.now()) {
                console.log("Websocket timeout");
                this.closeConnection();
                onClose();
                this.openConnection(address);
            }
            else if(this.isConnectionClosed()) {
                console.log("Attempting reconnect...");
                this.openConnection(address);
            }
        },5000);
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
        if(this.isConnectionOpen())
            this.sendMessage(JSON.stringify(data));
    }

    /**
     * Must be called by the websocket implementation's open callback
     */
    protected onConnectionOpen() {
        this.syncConnectionConfig();
        this.onOpen();
    }

    /**
     * Must be called by the websocket implementation's close callback
     */
    protected onConnectionClose() {
        this.onClose();
        this.openConnection(this.address);
    }

    protected onConnectionMessage(data: string) {
        this.lastMessage = Date.now();
        let message = JSON.parse(data);
        this.subscribers.forEach(subscriber => {
            if(message.hasOwnProperty(subscriber.key)) {
                subscriber.callback(message[subscriber.key]);
            }
        });
    }

    public abstract isConnectionOpen(): boolean;
    public abstract isConnectionClosed(): boolean;
    public abstract openConnection(address: string): void;
    public abstract closeConnection(): void;
    public abstract sendMessage(data: string): void;

}

export { EMRDataPoint, EMRStatus };