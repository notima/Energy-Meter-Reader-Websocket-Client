export interface EMRStatus {
    freeHeap: Number;
    heap: Number;
    freeFSSize: Number;
    fsSize: Number;
    uptime: Number;
    wifiSSID: string;
    wifiStatus: Number;
    wifiIP: string;
    ethStatus: Number;
    ethIP: string;
    otaInProgress: boolean;
    otaProgress: Number;
    validProductKey: boolean;
}