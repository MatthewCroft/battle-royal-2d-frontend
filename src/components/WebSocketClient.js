import SockJS from "sockjs-client";
import { Client } from '@stomp/stompjs';

class WebSocketClient {
    constructor() {
        this.client = null;
        this.subscriptions = new Map();
    }

    connect(uuid, onConnectCallback) {
        const socket = new SockJS('http://localhost:8080/ws');
        this.client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            debug: str => console.log('[WS]', str)
        });

        this.client.onConnect = () => {
            for (let [topic, callback] of this.subscriptions) {
                this.client.subscribe(topic, callback);
            }
            onConnectCallback?.();
        }
        this.client.activate();
    }

    subscribe(topic, callback) {
        this.subscriptions.set(topic, callback);
    }
}

export const WebSocketClientInstance = new WebSocketClient();