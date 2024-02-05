# Abstract Websocket client manager for Energy Meter Readers

An abstract websocket client manager for interfacing with Energy Meter Reader devices from Notima Energy Intelligence. The abstraction is made in order to be able to use with various Websocket engines.

The npm packages `energy-meter-reader-websocket-client-browser` and `energy-meter-reader-websocket-client-node` contain two different implementations.

The purpose of the client manager class is to:
 - create a websocket connection to an electricity meter reader
 - keep the connection alive
 - notify suscribers of any updates
 - reconnect if the connection is lost

## How the client manager works

A client is created simply by calling the constructor for `EMRWebsocketClientManager`. The client will connect automatically to the address passed to the constructor and will attempt to reconnect if the connection is lost. You can then create callback functions to be executed when certain messages are recieved on the websocket connection. All messages are JSON formatted so when registering a callback, you need to pass a JSON key to subscribe to. The callback will then be executed when the key is present with the value as argument.

Before any messages are sent from the server, the client needs to tell the server what messages to send this can be done as the following example suggests:

```typescript
client.send({
    connection: {
        statusUpdate: true|false,
        dataUpdate: true|false,
        log: true|false
    }
});
```

The helper functions `addStatusHandler`, `addDataHandler`, and `addLogHandler` exist to simplify the process of requesting and subscribing to messages. These functions will subscribe to their corresponding keys and request them from the server automatically if needed.

## Example usage

```typescript
this.wsClient = new EMRWebsocketClientManager(address, (ev: Event) => {
    console.log("Websocket connection opened");
}, (ev: Event) => {
    console.log("Websocket connection closed");
});

this.wsClient.addDataHandler((data) => {
    console.log(`Data received: ${data.topic} ${data.value} ${data.unit}`)
});
```

In the example above, a websocket client is being created and the `onOpen` and `onClosed` callbacks are defined as lambda functions. A data handler is then added to the client with a callback defined. This will activate data updates from the server on this connection.

## `EMRWebsocketClientManager` functions

the following sections explains the functions of the client class more in depth.

### constructor

Create a client manager and connect to the websocket server

Parameters:

- `address: string` - The address of the websocket server (the energy meter reader device. e.g. `ws://address:port`).
- `onOpen: (ev: Event): void` - The callback that is executed when a connection is opened.
- `onClose: (ev: Event): void;` - The callback that is executed when a connection is closed.

Example:

```typescript
client = new EMRWebsocketClientManager("ws://192.168.4.1/ws", (ev: Event) => {
    console.log("Websocket connection opened");
}, (ev: Event) => {
    console.log("Websocket connection closed");
});
```

### stop

Kills the client manager by closing the connection without attempting to reopen. 

### subscribe

Create a subscriber.
The subscriber callback function will be called when the corresponding key is present in a
websocket message (in json format).

***It is recommended to use one of the helper functions: `addStatusHandler`, `addDataHandler` or `addLogHandler` instead of calling this function directly.***

Parameters:

- `key: string` - The JSON key that will trigger the callback.
- `callback: (data: any): void` - The callback function that will be executed (with the value of the subscribed json key as argument).

Example:

```typescript
client.subscribe("data", (data) => {
    console.log("Data received")
});
```

### send

This function sends a message to the server. The object passed will be JSON stringified and transmitted as a string. 

***It is recommended to use one of the helper functions: `addStatusHandler`, `addDataHandler` or `addLogHandler` instead of calling this function directly.***

Parameters:

- `data: any` - The message to send. This will be JSON stringified so javascript objects are expected.

Example:

```typescript
client.send({
    connection: {
        statusUpdate: true
    }
});
```

### addStatusHandler

This is a helper function for automatically requesting and subscribing to status updates.

Parameters:

- `callback: (status: EMRStatus): void` - The callback function for handling status updates.

Example:

```typescript
client.addStatusHandler((status) => {
    console.log(`Status update received`)
});
```

### addDataHandler

This is a helper function for automatically requesting and subscribing to data updates.

Parameters:

- `callback: (data: EMRDataPoint): void` - The callback function for handling data updates.

Example:

```typescript
client.addStatusHandler((data) => {
    console.log(`New energy meter readings received`)
});
```

### addLogHandler

This is a helper function for automatically requesting and subscribing to system logs.

Parameters:

- `callback: (log: string): void` - The callback function for handling log entries.

Example:

```typescript
client.addLogHandler((log) => {
    console.log(`System log: ${log}`)
});
```

## How to implement

```typescript
import { EMRWebsocketClientManagerManager } from "nergy-meter-reader-websocket-client";

export class EMRWebsocketClientManagerImpl extends EMRWebsocketClientManagerManager {

    protected isConnectionOpen(): boolean {
        // return `true` if the websocket status is open
    }

    protected isConnectionClosed(): boolean {
        // return `true` if the websocket status is closed
    }

    protected openConnection(address: string): void {
        // Open a connection to `address` and setup callbacks.
        // The following functions must be called by the websocket engine:
        // `this.onConnectionOpen()` - when the connection is opened
        // `this.onConnectionClose()` - when the connection is closed
        // `this.onConnectionMessage(data: string)` - when a message is received on the connection
        // There should also be a mechanism for pinging the server to ensure a stable connection
        // Close the connection if no pong frames are returned.
    }

    protected closeConnection(): void {
        // close the connection
    }
    
    protected sendMessage(data: string): void {
        // send data on the connection. 
        // There is no need to check if the connection is open. This has already been done at this point.
    }
}
```

## Implementations:

### energy-meter-reader-websocket-client-browser

[Github](https://github.com/notima/Energy-Meter-Reader-Websocket-Client/tree/master/energy-meter-reader-websocket-client-node) | [NPM](https://www.npmjs.com/package/energy-meter-reader-websocket-client-browser)

This is an implementation that uses the built in browser api for websockets. It is lightweight and contain no other dependencies than the abstract package

### energy-meter-reader-websocket-client-node

[Github](https://github.com/notima/Energy-Meter-Reader-Websocket-Client/tree/master/energy-meter-reader-websocket-client-browser) | [NPM](https://www.npmjs.com/package/energy-meter-reader-websocket-client-node)

This implementation can be used for Node.js applications and uses the w3cwebsocket api.