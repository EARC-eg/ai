// ============================================================
// CHAT SYSTEM
// ============================================================

import { database, ref, get, set, push, query, limitToLast } from "./firebase-init.js";
import { authSystem } from "./auth.js";
import { API_KEY, API_URL, PROFESSOR_NAME, PROFESSOR_TITLE, PROFESSOR_HONOR, ALLOWED_LANGUAGE_REGEX } from "./config.js";

class MemorySystem {
    constructor() {
        this.db = database;
        this.currentSessionId = null;
    }

    getUserId() { 
        return authSystem.getUserId() || authSystem.getDeviceId(); 
    }

    getUserPath() { 
        const uid = this.getUserId(); 
        return authSystem.isLoggedIn() ? `users/${uid}/conversations` : `devices/${uid}/conversations`; 
    }

    async createSession(title) {
        const sessionRef = push(ref(this.db, this.getUserPath()));
        this.currentSessionId = sessionRef.key;
        await set(sessionRef, { 
            title: title || 'محادثة جديدة', 
            createdAt: Date.now(), 
            updatedAt: Date.now(), 
            messageCount: 0 
        });
        return this.currentSessionId;
    }

    async saveMessage(role, content) {
        if (!this.currentSessionId) {
            await this.createSession(content.substring(0, 50));
        }
        const messagesRef = push(ref(this.db, `${this.getUserPath()}/${this.currentSessionId}/messages`));
        await set(messagesRef, { 
            role, 
            content: content.substring(0, 3000), 
            timestamp: Date.now() 
        });
        
        // Update message count
        const sessionRef = ref(this.db, `${this.getUserPath()}/${this.currentSessionId}`);
        const session = await get(sessionRef);
        if (session.exists()) {
            const currentCount = session.val().messageCount || 0;
            await set(ref(this.db, `${this.getUserPath()}/${this.currentSessionId}/messageCount`), currentCount + 1);
            await set(ref(this.db, `${this.getUserPath()}/${this.currentSessionId}/updatedAt`), Date.now());
        }
    }

    async loadSessions() {
        const snap = await get(ref(this.db, this.getUserPath()));
        if (!snap.exists()) return [];
        const sessions = [];
        snap.forEach(c => { 
            const v = c.val(); 
            sessions.push({ 
                id: c.key, 
                title: v.title || 'محادثة', 
                createdAt: v.createdAt || 0, 
                updatedAt: v.updatedAt || 0, 
                messageCount: v.messageCount || 0 
            }); 
        });
        return sessions.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    }

    async loadSessionMessages(sid) {
        const snap = await get(query(ref(this.db, `${this.getUserPath()}/${sid}/messages`), limitToLast(50)));
        if (!snap.exists()) return [];
        const msgs = [];
        snap.forEach(c => msgs.push(c.val()));
        return msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    }
}

// Chat Manager Class
class ChatManager {
    constructor() {
        this.memorySystem = new MemorySystem();
        this.conversationHistory = [];
        this.messageCount = 0;
        this.currentLanguage = 'ar';
    }

    getSystemPrompt() {
        return `أنت "${PROFESSOR_NAME}"، ${PROFESSOR_TITLE} و${PROFESSOR_HONOR}. أنت خبير دولي في علم المناعة وأبحاث السرطان. لديك خبرة أكاديمية وبحثية واسعة. قم بالرد بلغة عربية فصيحة أو إنجليزية حسب سؤال المستخدم. قدم إجابات علمية دقيقة ومفيدة للباحثين والأطباء وطلاب الطب. استخدم أسلوباً أكاديمياً محترماً مع لمسة شخصية. إذا سُئلت عن هويتك، قل أنك "${PROFESSOR_NAME}"، ${PROFESSOR_TITLE} ورئيس الجمعية المصرية لأبحاث السرطان.`;
    }

    isValidLanguage(text) {
        return ALLOWED_LANGUAGE_REGEX.test(text);
    }

    async sendMessage(message, onStreamUpdate, onError) {
        if (!this.isValidLanguage(message)) {
            onError("⚠️ عذراً، يُسمح فقط باللغة العربية والإنجليزية. يرجى كتابة سؤالك بهاتين اللغتين فقط.");
            return;
        }

        this.conversationHistory.push({ role: "user", content: message });
        
        // Save user message
        if (this.memorySystem.currentSessionId) {
            await this.memorySystem.saveMessage('user', message);
        }

        try {
            const messagesToSend = [
                { role: "system", content: this.getSystemPrompt() },
                ...this.conversationHistory.slice(-20)
            ];

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: messagesToSend,
                    temperature: 0.6,
                    max_tokens: 2000
                })
            });

            const data = await response.json();
            const reply = data.choices[0].message.content;
            
            this.conversationHistory.push({ role: "assistant", content: reply });
            
            // Save assistant message
            if (this.memorySystem.currentSessionId) {
                await this.memorySystem.saveMessage('assistant', reply);
            }
            
            onStreamUpdate(reply);
        } catch (error) {
            console.error('API Error:', error);
            onError("⚠️ عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.");
        }
    }

    async newSession() {
        this.conversationHistory = [];
        this.messageCount = 0;
        await this.memorySystem.createSession('محادثة جديدة');
    }

    async loadSession(sessionId) {
        const messages = await this.memorySystem.loadSessionMessages(sessionId);
        this.memorySystem.currentSessionId = sessionId;
        this.conversationHistory = [];
        this.messageCount = 0;
        
        for (const msg of messages) {
            this.conversationHistory.push({ role: msg.role, content: msg.content });
        }
        
        return messages;
    }

    async loadSessions() {
        return await this.memorySystem.loadSessions();
    }

    getCurrentSessionId() {
        return this.memorySystem.currentSessionId;
    }

    setCurrentSessionId(id) {
        this.memorySystem.currentSessionId = id;
    }
}

export const chatManager = new ChatManager();
