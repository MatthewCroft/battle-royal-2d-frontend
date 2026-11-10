import Phaser from 'phaser';
import { GameScene } from './game/GameScene.js';
import { MenuScene } from "./menu/MenuScene.js";

const config = {
    type: Phaser.AUTO,
    backgroundColor: '#1e1e1e',
    scale: {
        width: 1920,
        height: 1080
    },
    scene: [MenuScene, GameScene]
}

new Phaser.Game(config);