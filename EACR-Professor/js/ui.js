// ============================================================
// UI MANAGER
// ============================================================

import { PROFESSOR_NAME, PROFESSOR_TITLE, PROFESSOR_HONOR, PROFESSOR_AVATAR, WHATSAPP_NUMBER, TOOL_PROMPTS } from "./config.js";

class UIManager {
    constructor() {
        this.chatArea = document.getElementById('chatArea');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendBtn');
        this.typingIndicator = document.getElementById('typing');
        this.dropdownMenu = document.getElementById('dropdownMenu');
        this.sessionsModal = document.getElementById('sessionsModal');
        this.authOverlay = document.getElementById('authOverlay');
        this.floatingToolbar = document.getElementById('floatingToolbar');
        this.lastScroll = 0;
    }

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        }).replace(/\n/g, '<br>');
    }

    appendMessage(text, isUser, isWelcome = false) {
        const wrapper = document.createElement('div');
        if (isUser) {
            wrapper.className = 'msg-user';
            wrapper.innerHTML = `<div class="msg-user-bubble">${this.escapeHtml(text)}</div>`;
        } else {
            wrapper.className = 'msg-ai';
            wrapper.innerHTML = `<img src="${PROFESSOR_AVATAR}" class="msg-ai-avatar" alt="${PROFESSOR_NAME}"><div class="msg-ai-bubble"><div class="msg-ai-content">${this.escapeHtml(text)}</div><div class="msg-ai-meta"><span>${PROFESSOR_NAME}</span><span>•</span><span>${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span></div></div>`;
        }
        this.chatArea.insertBefore(wrapper, this.typingIndicator);
        this.scrollToBottom();
    }

    showWelcomeMessage() {
        const welcomeHTML = `
            <div class="welcome-card">
                <img src="${PROFESSOR_AVATAR}" class="welcome-image" alt="${PROFESSOR_NAME}">
                <div class="welcome-name">${PROFESSOR_NAME}</div>
                <div class="welcome-title">${PROFESSOR_TITLE}</div>
                <div class="honor-badge">🏛️ ${PROFESSOR_HONOR}</div>
                <div class="welcome-bio">
                    السلام عليكم ورحمة الله وبركاته<br>
                    أنا <strong>${PROFESSOR_NAME}</strong><br>
                    يشرفني تواصلكم معي للاستفسار عن:
                </div>
                <hr class="welcome-divider">
                <div class="welcome-bio" style="font-size:12px; text-align:right; padding-right:10px;">
                    🔬 <strong>علم المناعة</strong> - أساسيات وتطبيقات<br>
                    🧬 <strong>أبحاث السرطان</strong> - أحدث الاكتشافات<br>
                    💊 <strong>العلاجات المناعية</strong> - آليات وتطورات<br>
                    📚 <strong>الاستشارات الأكاديمية</strong> - للباحثين والطلاب
                </div>
                <button class="whatsapp-professional" id="whatsappWelcomeBtn">
                    <span class="btn-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke="white">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                        </svg>
                    </span>
                    <span class="btn-text">📱 تواصل معي عبر واتساب</span>
                </button>
            </div>
        `;
        this.appendMessage(welcomeHTML, false, true);
        
        // Add event listener to the WhatsApp button after it's added to DOM
        setTimeout(() => {
            const whatsappBtn = document.getElementById('whatsappWelcomeBtn');
            if (whatsappBtn) {
                whatsappBtn.addEventListener('click', () => this.openWhatsApp());
            }
        }, 100);
    }

    openWhatsApp() {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=السلام%20عليكم%20دكتور%20محمد%20لبيب%20سالم%0Aأود%20الاستفسار%20عن...`, '_blank');
    }

    showTyping(show) {
        this.typingIndicator.style.display = show ? 'flex' : 'none';
    }

    scrollToBottom() {
        this.chatArea.scrollTo({ top: this.chatArea.scrollHeight, behavior: 'smooth' });
    }

    clearChat() {
        const messages = this.chatArea.querySelectorAll('.msg-ai, .msg-user');
        messages.forEach(msg => msg.remove());
    }

    showSuccess(message) {
        const w = document.createElement('div');
        w.className = 'msg-ai';
        w.innerHTML = `<div class="msg-ai-bubble" style="background:#ecfdf5;border-color:#a7f3d0;"><div class="msg-ai-content" style="color:#059669;">✅ ${message}</div></div>`;
        this.chatArea.insertBefore(w, this.typingIndicator);
        setTimeout(() => { if (w && w.remove) w.remove(); }, 3000);
        this.scrollToBottom();
    }

    showError(message) {
        const w = document.createElement('div');
        w.className = 'msg-ai';
        w.innerHTML = `<div class="msg-ai-bubble" style="background:#fef2f2;border-color:#fecaca;"><div class="msg-ai-content" style="color:#dc2626;">⚠️ ${message}</div></div>`;
        this.chatArea.insertBefore(w, this.typingIndicator);
        setTimeout(() => { if (w && w.remove) w.remove(); }, 4000);
        this.scrollToBottom();
    }

    updateSessionCount(count) {
        const sessionCountSpan = document.getElementById('sessionCount');
        if (sessionCountSpan) sessionCountSpan.textContent = count;
    }

    renderSessionsList(sessions, onSessionClick) {
        const sessionsList = document.getElementById('sessionsList');
        if (!sessionsList) return;
        
        if (sessions.length) {
            sessionsList.innerHTML = sessions.map(s => `
                <div class="session-item" data-session-id="${s.id}">
                    <div class="session-info">
                        <div class="session-title">${this.escapeHtml(s.title)}</div>
                        <div class="session-meta">${new Date(s.createdAt).toLocaleDateString('ar-EG')} • ${s.messageCount || 0} رسالة</div>
                    </div>
                </div>
            `).join('');
            
            // Add click handlers
            document.querySelectorAll('.session-item').forEach(item => {
                item.addEventListener('click', () => onSessionClick(item.dataset.sessionId));
            });
        } else {
            sessionsList.innerHTML = '<div class="session-empty">📭 لا توجد محادثات سابقة. ابدأ محادثة جديدة!</div>';
        }
    }

    showSessionsModal(show) {
        if (show) {
            this.sessionsModal.classList.add('show');
        } else {
            this.sessionsModal.classList.remove('show');
        }
    }

    showAuthModal(show) {
        if (show) {
            this.authOverlay.classList.add('show');
        } else {
            this.authOverlay.classList.remove('show');
        }
    }

    toggleDropdown() {
        this.dropdownMenu.classList.toggle('show');
    }

    closeDropdown() {
        this.dropdownMenu.classList.remove('show');
    }

    getUserInput() {
        return this.userInput.value.trim();
    }

    clearUserInput() {
        this.userInput.value = '';
    }

    focusUserInput() {
        this.userInput.focus();
    }

    setSendButtonEnabled(enabled) {
        this.sendButton.disabled = !enabled;
    }

    setupScrollHandler() {
        this.chatArea.addEventListener('scroll', () => {
            const st = this.chatArea.scrollTop;
            const sh = this.chatArea.scrollHeight;
            const ch = this.chatArea.clientHeight;
            if (st > this.lastScroll && st > 100 && (sh - st - ch > 60)) {
                this.floatingToolbar.style.opacity = '0.4';
                this.floatingToolbar.style.transform = 'translateX(-50%) translateY(20px) scale(0.95)';
            } else {
                this.floatingToolbar.style.opacity = '1';
                this.floatingToolbar.style.transform = 'translateX(-50%) translateY(0) scale(1)';
            }
            this.lastScroll = st;
        });
    }

    getToolPrompt(tool) {
        return TOOL_PROMPTS[tool] || '';
    }

    setUserInputValue(value) {
        this.userInput.value = value;
    }

    updateUserButton(isLoggedIn, user) {
        const btn = document.getElementById('userBtn');
        if (!btn) return;
        
        if (isLoggedIn && user) {
            btn.classList.add('logged-in');
            if (user.picture) {
                btn.innerHTML = `<img src="${user.picture}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            } else {
                btn.innerHTML = `<span style="font-size:12px;font-weight:700;color:var(--accent-primary);">${user.name.charAt(0)}</span>`;
            }
            btn.title = user.name;
        } else {
            btn.classList.remove('logged-in');
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
            btn.title = 'تسجيل الدخول';
        }
    }

    updateDropdownLoginState(isLoggedIn) {
        const loginItem = document.getElementById('dropdownLoginItem');
        const logoutItem = document.getElementById('dropdownLogoutItem');
        const divider = document.getElementById('dropdownDividerLogin');
        
        if (isLoggedIn) {
            if (loginItem) loginItem.style.display = 'none';
            if (logoutItem) logoutItem.style.display = 'flex';
            if (divider) divider.style.display = 'block';
        } else {
            if (loginItem) loginItem.style.display = 'flex';
            if (logoutItem) logoutItem.style.display = 'none';
            if (divider) divider.style.display = 'none';
        }
    }

    getLoginEmail() { return document.getElementById('loginEmail')?.value.trim() || ''; }
    getLoginPassword() { return document.getElementById('loginPassword')?.value || ''; }
    getRegisterName() { return document.getElementById('registerName')?.value.trim() || ''; }
    getRegisterEmail() { return document.getElementById('registerEmail')?.value.trim() || ''; }
    getRegisterPassword() { return document.getElementById('registerPassword')?.value || ''; }
    
    showLoginError(message) {
        const err = document.getElementById('loginError');
        if (err) {
            err.textContent = message;
            err.classList.add('show');
            setTimeout(() => err.classList.remove('show'), 3000);
        }
    }
    
    showRegisterError(message) {
        const err = document.getElementById('registerError');
        if (err) {
            err.textContent = message;
            err.classList.add('show');
            setTimeout(() => err.classList.remove('show'), 3000);
        }
    }
    
    clearAuthFields() {
        const fields = document.querySelectorAll('.input-field');
        fields.forEach(f => f.value = '');
    }

    setAuthButtonLoading(buttonId, isLoading, originalText) {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.disabled = isLoading;
            btn.textContent = isLoading ? 'جاري...' : originalText;
        }
    }
}

export const uiManager = new UIManager();
