export class AuthService {
    //todo: create login request for form based login
    static async login(email, password) {

    }

    static getToken() {
        return localStorage.getItem('token');
    }

    static isLoggedIn() {
        return !!this.getToken();
    }

    static logout() {
        localStorage.removeItem('token');
    }
}