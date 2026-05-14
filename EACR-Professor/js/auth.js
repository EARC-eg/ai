// ============================================================
// AUTHENTICATION SYSTEM
// ============================================================

import { database, ref, get, set, push } from "./firebase-init.js";

class AuthSystem {
    constructor() {
        this.db = database;
        this.currentUser = null;
    }

    saveSession(userData) {
        const session = {
            userId: userData.userId,
            email: userData.email,
            name: userData.name,
            picture: userData.picture || '',
            loginTime: Date.now(),
            provider: userData.provider || 'email'
        };
        localStorage.setItem('eacr_user_session', JSON.stringify(session));
        this.currentUser = session;
    }

    restoreSession() {
        try {
            const session = localStorage.getItem('eacr_user_session');
            if (session) {
                const data = JSON.parse(session);
                if (Date.now() - data.loginTime < 30 * 24 * 60 * 60 * 1000) {
                    this.currentUser = data;
                    return data;
                }
            }
        } catch(e) {}
        return null;
    }

    clearSession() {
        localStorage.removeItem('eacr_user_session');
        this.currentUser = null;
    }

    async findUserByEmail(email) {
        const snap = await get(ref(this.db, 'users'));
        if (!snap.exists()) return null;
        const users = snap.val();
        for (const key in users) {
            if (users[key].email === email) return { id: key, ...users[key] };
        }
        return null;
    }

    async register(name, email, password, provider = 'email', picture = '') {
        try {
            const existing = await this.findUserByEmail(email);
            if (existing) return { success: false, error: 'البريد مسجل بالفعل' };
            
            const newRef = push(ref(this.db, 'users'));
            const userId = newRef.key;
            const hashed = password ? await this.hashPassword(password) : '';
            
            const userData = {
                userId, name: name || email.split('@')[0], email,
                password: hashed, provider, picture,
                createdAt: Date.now(), lastLogin: Date.now(),
                totalSessions: 0, totalMessages: 0
            };
            
            await set(newRef, userData);
            const sessionData = { userId, email, name: userData.name, picture, provider };
            this.saveSession(sessionData);
            return { success: true, user: sessionData };
        } catch(e) {
            return { success: false, error: 'حدث خطأ أثناء التسجيل' };
        }
    }

    async login(email, password) {
        try {
            const user = await this.findUserByEmail(email);
            if (!user) return { success: false, error: 'البريد غير مسجل' };
            if (user.provider === 'google' && !user.password) return { success: false, error: 'استخدم زر Google لتسجيل الدخول' };
            
            const hashed = await this.hashPassword(password);
            if (user.password !== hashed) return { success: false, error: 'كلمة مرور خاطئة' };
            
            await set(ref(this.db, `users/${user.id}/lastLogin`), Date.now());
            const sessionData = { userId: user.userId, email: user.email, name: user.name, picture: user.picture || '', provider: 'email' };
            this.saveSession(sessionData);
            return { success: true, user: sessionData };
        } catch(e) {
            return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' };
        }
    }

    async handleGoogleUser(googleData) {
        const { email, name, picture } = googleData;
        const existing = await this.findUserByEmail(email);
        
        if (existing) {
            await set(ref(this.db, `users/${existing.id}/lastLogin`), Date.now());
            if (picture) await set(ref(this.db, `users/${existing.id}/picture`), picture);
            const sessionData = { userId: existing.userId, email, name: existing.name, picture: picture || existing.picture || '', provider: 'google' };
            this.saveSession(sessionData);
            return { success: true, user: sessionData, isNew: false };
        } else {
            const result = await this.register(name, email, '', 'google', picture);
            if (result.success) result.isNew = true;
            return result;
        }
    }

    logout() { 
        this.clearSession(); 
        return true; 
    }

    async hashPassword(pw) {
        if (!pw) return '';
        const data = new TextEncoder().encode(pw + 'eacr_salt');
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    getDeviceId() {
        let id = localStorage.getItem('eacr_device_id');
        if (!id) {
            id = 'dev_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
            localStorage.setItem('eacr_device_id', id);
        }
        return id;
    }

    isLoggedIn() { return this.currentUser !== null; }
    getUserId() { return this.currentUser ? this.currentUser.userId : null; }
}

// Create and export singleton instance
export const authSystem = new AuthSystem();
