'use strict';

class SessionManager {
    constructor() {
        this.sessionDictionary = [];
    }
    setToken(file) {
        let token = 'dsadsa';
        this.sessionDictionary[token] = file;
        console.log(this.sessionDictionary);
        return token;
    }
    consumeToken(token) {
        if (!this.sessionDictionary.hasOwnProperty(token)) {
            console.error('Token not exist');
            return void 0;
        }
        let content = this.sessionDictionary[token];
        console.log('Getting', content, ' Current length:', this.sessionDictionary.length, this.sessionDictionary);
        this.sessionDictionary[token] = void 0;
        delete this.sessionDictionary[token];
        console.log('After deletion. Current length:', this.sessionDictionary.length);
        return content;
    }
}

var sessionManager = new SessionManager();
module.exports = sessionManager;