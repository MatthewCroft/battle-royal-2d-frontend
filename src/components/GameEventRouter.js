import {WebSocketClientInstance} from "./WebSocketClient.js";

export class GameEventRouter {
    constructor(scene, uuid) {
        this.scene = scene;
        this.uuid = uuid;

        const base = `/topic/${uuid}`;
        WebSocketClientInstance.subscribe(`${base}/player`, this.handlePlayer.bind(this));
        WebSocketClientInstance.subscribe(`${base}/zone`, this.handleZone.bind(this));
        WebSocketClientInstance.subscribe(`${base}/bullets`, this.handleBullet.bind(this));
        WebSocketClientInstance.subscribe(`${base}/events`, this.handleEvent.bind(this));
    }

    handlePlayer(message) {

    }

    handleBullet(message) {
        const data = JSON.parse(message.body);
        this.scene.bulletManager.updateFromServer(data);
    }

    handleZone(message) {
        const data = JSON.parse(message.body);
        this.scene.zoneManager.updateFromServer(data);
    }

    handleEvent(message) {
        const data = JSON.parse(message.body);
        this.scene.feedbackManager.handleEvent(data);
    }
}