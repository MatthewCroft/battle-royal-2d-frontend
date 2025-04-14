export class LoginScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoginScene' });
    }

    create() {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
         if (token) {
             localStorage.setItem('token', token);

             window.history.replaceState({}, document.title, '/');

             this.scene.start('MenuScene');
         }

        this.add.text(960, 200, 'Battle Royal 2D', {
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const emailInput = this.add.dom(960, 300, 'input', 'width: 300px; height: 40px;', '').setOrigin(0.5);
        const passwordInput = this.add.dom(960, 360, 'input', 'width: 300px; height: 40px;', '').setOrigin(0.5);
        passwordInput.node.type = 'password';

        const loginBtn = this.add.text(960, 420, 'Login', {
            fontSize: '24px',
            backgroundColor: '#00ff00',
            padding: { x: 20, y: 10 },
        }).setOrigin(0.5).setInteractive();

        // loginBtn.on('pointerdown', async () => {
        //     const email = emailInput.node.value;
        //     const password = passwordInput.node.value;
        //
        //     try {
        //         await AuthService.login(email, password);
        //         this.scene.start('MatchmakingScene');
        //     } catch (err) {
        //         console.error('Login failed', err);
        //     }
        // });

        const oauthBtn = this.add.text(960, 480, 'Login with Google', {
            fontSize: '20px',
            backgroundColor: '#dddddd',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive();

        oauthBtn.on('pointerdown', () => {
            window.location.href = 'http://localhost:8081/oauth2/authorization/google'; // adjust to match backend
        });
    }
}