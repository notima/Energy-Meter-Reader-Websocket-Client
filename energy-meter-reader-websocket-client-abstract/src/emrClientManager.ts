import { EMRDataPoint } from "./emrData";
import { EMRStatus } from "./emrStatus";

export const DATA_KEY = "data"
export const STATUS_KEY = "status"
export const LOG_KEY = "log"

/**
 * A subscriber has a callback function that is triggered when
 * it's corresponding key is present in the json object received
 * on the websocket connection.
 */
interface Subscriber {
    /**
     * Json key that will trigger this callback
     */
    key: string;
    /**
     * callback function.
     * The data parameter is the value of the key as a JS object.
     */
    callback: {(data:any): void};
}

/**
 * A copy of the connection configuration on the server.
 * The configuration is synced by calling EMRWebsocketClientManager#syncConnectionConfig
 */
interface ConnectionConfig {
    /**
     * Should this connection receive status updates?
     */
    statusUpdate: boolean;
    /**
     * Should this connection receive electricity meter reading data updates?
     */
    dataUpdate: boolean;
    /**
     * Should this connection receive system logs from the host device?
     */
    log: boolean;
}

/**
 * The purpose of this class is to:
 * - create a websocket connection to an electricity meter reader
 * - keep the connection alive
 * - notify suscribers of any updates
 * - reconnect if the connection is lost
 */
export abstract class EMRWebsocketClientManager {
    protected subscribers: Subscriber[] = [];
    protected address: string;
    protected config: ConnectionConfig = {} as ConnectionConfig;
    protected reconnectTimer: number = 5000;

    /**
     * Timestamp of last received message from server
     */
    protected lastMessage: number;

    // Websocket callback functions
    private onOpen: {():void};
    private onClose: {():void};

    private reconnetIntervalId: number;
    private stopped: boolean = false;

    /**
     * Create a client manager and connect to the websocket server
     * @param address The websocket server address (eg `ws://address:port`)
     * @param onOpen function to be called when a connection is successfully opened
     * @param onClose function to be called when a connection is closed
     */
    constructor(address: string, onOpen: {():void}, onClose: {():void}) {
        this.address = address;
        this.onOpen = onOpen;
        this.onClose = onClose;
        this.openConnection(address);
        this.startReconnectTimer();
    }

    /**
     * Kills the client manager by closing the connection without attempting to reopen
     */
    public stop() {
        this.stopped = true;
        clearInterval(this.reconnetIntervalId);
        this.closeConnection();
        this.subscribers = [];
        this.onOpen = ()=>{};
        this.onClose = ()=>{};
    }

    /**
     * Subscribe to status updates.
     * This function will register a 'status' subscriber and configure the server to send status updates.
     * @param callback The subscriber callback function
     */
    public addStatusHandler(callback: {(data:EMRStatus): void}) {
        this.subscribe(STATUS_KEY, callback);
        if(!this.config.statusUpdate) {
            this.config.statusUpdate = true;
            this.syncConnectionConfig();
        }
    }

    /**
     * Subscribe to energy meter reading data updates.
     * This function will register a 'data' subscriber and configure the server to send data updates.
     * @param callback The subscriber callback function
     */
    public addDataHandler(callback: {(data:EMRDataPoint): void}) {
        this.subscribe(DATA_KEY, callback);
        if(!this.config.dataUpdate) {
            this.config.dataUpdate = true;
            this.syncConnectionConfig();
        }
    }

    /**
     * Subscribe to system log updates.
     * This function will register a 'log' subscriber and configure the server to send log updates.
     * @param callback The subscriber callback function
     */
    public addLogHandler(callback: {(data:string): void}) {
        this.subscribe(LOG_KEY, callback);
        if(!this.config.log) {
            this.config.log = true;
            this.syncConnectionConfig();
        }
    }

    /**
     * Send the local connection config object to the server.
     */
    private syncConnectionConfig() {
        this.send({connection: this.config});
    }

    /**
     * Create a subscriber.
     * The subscriber callback function will be called when the corresponding key is present in a
     * websocket message (in json format).
     * It is recommended to use one of the helper functions: `addStatusHandler`, `addDataHandler` or `addLogHandler`
     * instead of calling this function directly.
     * @param key The key that is subscribed to.
     * @param callback The callback to be triggered. The `data` parameter is the value of the key.
     */
    public subscribe(key: string, callback: {(data:any): void}) {
        this.subscribers.push({
            key: key,
            callback: callback
        } as Subscriber);
    }

    /**
     * Send data to the server. The object passed will be JSON stringified and sent as a string.
     * @param data The data to send to the server
     */
    public send(data: any): void {
        if(this.isConnectionOpen())
            this.sendMessage(JSON.stringify(data));
    }

    /**
     * Set the reconnect interval duration
     * @param time The interval time in milliseconds for the reconnect timer.
     */
    public setReconnectTimer(time: number) {
        this.reconnectTimer = time;
        clearInterval(this.reconnetIntervalId);
        this.startReconnectTimer();
    }

    /**
     * Must be called by the websocket implementation's open callback
     */
    protected onConnectionOpen() {
        this.syncConnectionConfig();
        this.lastMessage = Date.now();
        this.onOpen();
    }

    /**
     * Must be called by the websocket implementation's close callback
     */
    protected onConnectionClose() {
        this.onClose();
        if(!this.stopped)
            this.openConnection(this.address);
    }

    /**
     * Must be called by the websocket implementations message callback
     * @param data The message received form the server
     */
    protected onConnectionMessage(data: string) {
        this.lastMessage = Date.now();
        let message = JSON.parse(data);
        this.subscribers.forEach(subscriber => {
            if(message.hasOwnProperty(subscriber.key)) {
                subscriber.callback(message[subscriber.key]);
            }
        });
    }

    /**
     * Starts an interval that pings the server and checks if the server has responded within 
     * our grace period duration.
     * In order for this to work, each implementation needs to reset the this#lastMessage
     * variable to Date#now whenever a pong packet is received.
     */
    private startReconnectTimer(): void {
        this.reconnetIntervalId = setInterval(()=>{
            if(this.isConnectionClosed()) {
                console.log("Attempting reconnect...");
                this.openConnection(this.address);
            }
        },this.reconnectTimer);
    }

    /**
     * @return true if there is an open websocket connection
     */
    public abstract isConnectionOpen(): boolean;
    
    /**
     * @return true if there is no open websocket connection and no attempt is being made to open
     * a connection at the moment.
     */
    public abstract isConnectionClosed(): boolean;

    /**
     * Open a connection
     * @param address the server address
     */
    public abstract openConnection(address: string): void;

    /**
     * Close any currently open connection
     */
    public abstract closeConnection(): void;

    /**
     * Send a message to the server
     * @param data the data to be sent.
     */
    protected abstract sendMessage(data: string): void;

}

export { EMRDataPoint, EMRStatus };