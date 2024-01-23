# Energy Meter Reader Websocket client

This package contains a websocket client for connecting to Energy Meter Reader devices from Notima Energy Intelligence. The client allows handlers to receive status updates, data updates, and logs from the device.

## How the client works

A client is created simply by calling the constructor for `EMRWebsocketClient`. The client will connect automatically to the address passed to the constructor and will attempt to reconnect if the connection is lost. You can then create callback functions to be executed when certain messages are recieved on the websocket connection. All messages are JSON formatted so when registering a callback, you need to pass a JSON key to subscribe to. The callback will then be executed when the key is present with the value as argument.

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
this.wsClient = new EMRWebsocketClient(address, (ev: Event) => {
    console.log("Websocket connection opened");
}, (ev: Event) => {
    console.log("Websocket connection closed");
});

this.wsClient.addDataHandler((data) => {
    console.log(`Data received: ${data.topic} ${data.value} ${data.unit}`)
});
```

In the example above, a websocket client is being created and the `onOpen` and `onClosed` callbacks are defined as lambda functions. A data handler is then added to the client with a callback defined. This will activate data updates from the server on this connection.

## `EMRWebsocketClient` functions

the following sections explains the functions of the client class more in depth.

### constructor
Parameters:
- `address: string` - The address of the websocket server (the energy meter reader device).
- `onOpen: (ev: Event): void` - The callback that is executed when a connection is opened.
- `onClose: (ev: Event): void;` - The callback that is executed when a connection is closed.

Example:
```typescript
client = new EMRWebsocketClient("ws://192.168.4.1/ws", (ev: Event) => {
    console.log("Websocket connection opened");
}, (ev: Event) => {
    console.log("Websocket connection closed");
});
```

### subscribe
This function subscribes to a json key in messages received from the server.

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
This function sends a message to the server. ***It is recommended to use one of the helper functions instead of calling this function to request updates.***

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