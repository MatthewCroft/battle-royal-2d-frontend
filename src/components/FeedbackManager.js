export class FeedbackManager {
    constructor(scene) {
       this.scene = scene;
       this.cooldowns = new Map();
    }

    playSound(key) {
        const now = performance.now();
        const lastPlay = this.cooldowns.get(key) || 0;
        const cooldown = 50;

        if (now - lastPlay >= cooldown) {
            this.scene.sound.play(key);
            this.cooldowns.set(key, now);
        }
    }

    pulse(obj, scale = 1.2, duration = 100) {
        if (!obj || !obj.scene) return;


        this.scene.tweens.killTweensOf(obj);
        obj.setScale(1);

        this.scene.tweens.add({
            targets: obj,
            scaleX: scale,
            scaleY: scale,
            yoyo: true,
            duration,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                obj.setScale(1);
            }
        });
    }

    flash(obj, color = 0xffffff, duration = 100) {
        // not a game object
        if (!obj || !obj.setTint) return;

        obj.setTint(color);
        this.scene.time.delayedCall(duration, () => {
            obj.clearTint();
        });
    }

    impact(obj) {
        this.flash(obj, 0xff0000, 100);
        this.pulse(obj);
        this.playSound('hit');
    }

    wallCollision(obj) {
        this.playSound('wall-collision');
    }

    playersCollision(obj) {
        this.playSound('players-collision');
    }

    localPlayerDamage(playerManager) {
        this.flash(playerManager, 0xff0000, 100);
        this.pulse(playerManager);
        this.playSound('damage');
    }

    enemyPlayerDamage(playerManager) {
        //this.flash(playerManager, 0xff0000, 100);
        this.pulse(playerManager);
        this.playSound('hit');
    }

    shootBullet() {
        this.playSound('shot');
    }

    zoneTick() {
        this.playSound('zone');
    }
}