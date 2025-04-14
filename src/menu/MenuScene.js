import {UIButton} from "../components/UIButton.js";

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#ffffff');

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        const buttonWidth = 250;
        const buttonHeight = 80;

        new UIButton(this, centerX - 150, centerY, buttonWidth, buttonHeight, 'Play', () => {
            this.scene.start('GameScene');
        });

        new UIButton(this, centerX + 150, centerY, buttonWidth, buttonHeight, 'How to Play', () => {
            alert('Use WASD to move and click to shoot. Capture the zone to win!');
        });
    }
}