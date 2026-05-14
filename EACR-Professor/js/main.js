// ============================================================
// MAIN APPLICATION ENTRY POINT
// ============================================================

import { authSystem } from "./auth.js";
import { chatManager } from "./chat.js";
import { uiManager } from "./ui.js";
import { PROFESSOR_NAME, WHATSAPP_NUMBER } from "./config.js";

// Global variables
let currentLanguage = 'ar';

// ============================================================
// Google Sign-In Handlers
// ============================================================

async function handleGoogleSignInResponse(response) {
    try {
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        
        const result = await authSystem.handleGoogleUser({
            email: payload.email,
            name: payload.name,
            picture: payload.picture || ''
        });
        
        if (result.success) {
            uiManager.showAuthModal(false);
            uiManager.updateUserButton(true, result.user);
            uiManager.updateDropdownLoginState(true);
            uiManager.clearAuthFields();
            await loadAndDisplaySessions();
            uiManager.showSuccess(result.isNew ? '✅ تم إنشاء حسابك بنجاح! مرحباً بك في منصة أ.د محمد لبيب سالم' : '✅ تم تسجيل الدخول بنجاح!');
        }
    } catch(e) {
        console.error('Google callback error:', e);
        uiManager.showError('حدث خطأ في تسجيل الدخول عبر Google');
    }
}

// Expose handler globally
window.handleGoogleSignIn = handleGoogleSignInResponse;

// ============================================================
// Authentication Functions
// ============================================================

async function handleLogin() {
    const email = uiManager.getLoginEmail();
    const password = uiManager.getLoginPassword();
    
    if (!email || !password) {
        uiManager.showLoginError('أدخل البريد وكلمة المرور');
        return;
    }
    
    uiManager.setAuthButtonLoading('loginBtn', true, 'تسجيل الدخول');
    const result = await authSystem.login(email, password);
    
    if (result.success) {
        uiManager.showAuthModal(false);
        uiManager.updateUserButton(true, result.user);
        uiManager.updateDropdownLoginState(true);
        uiManager.clearAuthFields();
        await loadAndDisplaySessions();
        uiManager.showSuccess('✅ تم تسجيل الدخول بنجاح');
    } else {
        uiManager.showLoginError(result.error);
    }
    
    uiManager.setAuthButtonLoading('loginBtn', false, 'تسجيل الدخول');
}

async function handleRegister() {
    const name = uiManager.getRegisterName();
    const email = uiManager.getRegisterEmail();
    const password = uiManager.getRegisterPassword();
    
    if (!name || !email || !password) {
        uiManager.showRegisterError('املأ جميع الحقول');
        return;
    }
    
    if (password.length < 6) {
        uiManager.showRegisterError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
    }
    
    uiManager.setAuthButtonLoading('registerBtn', true, 'إنشاء حساب');
    const result = await authSystem.register(name, email, password);
    
    if (result.success) {
        uiManager.showAuthModal(false);
        uiManager.updateUserButton(true, result.user);
        uiManager.updateDropdownLoginState(true);
        uiManager.clearAuthFields();
        await loadAndDisplaySessions();
        uiManager.showSuccess('✅ تم إنشاء الحساب بنجاح');
    } else {
        uiManager.showRegisterError(result.error);
    }
    
    uiManager.setAuthButtonLoading('registerBtn', false, 'إنشاء حساب');
}

function handleLogout() {
    authSystem.logout();
    uiManager.updateUserButton(false, null);
    uiManager.updateDropdownLoginState(false);
    uiManager.showSuccess('👋 تم تسجيل الخروج بنجاح');
}

// ============================================================
// Chat Functions
// ============================================================

async function sendMessage() {
    const message = uiManager.getUserInput();
    if (!message) return;
    
    uiManager.appendMessage(message, true);
    uiManager.clearUserInput();
    uiManager.setSendButtonEnabled(false);
    uiManager.showTyping(true);
    
    await chatManager.sendMessage(
        message,
        (reply) => {
            uiManager.showTyping(false);
            uiManager.appendMessage(reply, false);
            uiManager.setSendButtonEnabled(true);
            uiManager.focusUserInput();
        },
        (error) => {
            uiManager.showTyping(false);
            uiManager.showError(error);
            uiManager.setSendButtonEnabled(true);
            uiManager.focusUserInput();
        }
    );
}

async function createNewChat() {
    uiManager.closeDropdown();
    uiManager.clearChat();
    await chatManager.newSession();
    uiManager.showWelcomeMessage();
}

async function loadAndDisplaySessions() {
    const sessions = await chatManager.loadSessions();
    uiManager.updateSessionCount(sessions.length);
    return sessions;
}

async function showSessionsList() {
    uiManager.closeDropdown();
    const sessions = await chatManager.loadSessions();
    uiManager.renderSessionsList(sessions, async (sessionId) => {
        uiManager.showSessionsModal(false);
        uiManager.clearChat();
        const messages = await chatManager.loadSession(sessionId);
        
        if (messages.length === 0) {
            uiManager.showWelcomeMessage();
        } else {
            for (const msg of messages) {
                uiManager.appendMessage(msg.content, msg.role === 'user');
            }
        }
    });
    uiManager.showSessionsModal(true);
}

async function loadUserSessions() {
    const sessions = await chatManager.loadSessions();
    uiManager.updateSessionCount(sessions.length);
}

// ============================================================
// UI Event Handlers
// ============================================================

function setupEventListeners() {
    // Send button
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    
    // User input enter key
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Dropdown toggle
    const dropdownToggle = document.getElementById('dropdownToggleBtn');
    if (dropdownToggle) {
        dropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            uiManager.toggleDropdown();
        });
    }
    
    // New chat button
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) newChatBtn.addEventListener('click', createNewChat);
    
    // Show sessions button
    const showSessionsBtn = document.getElementById('showSessionsBtn');
    if (showSessionsBtn) showSessionsBtn.addEventListener('click', showSessionsList);
    
    // Login/Register buttons
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) registerBtn.addEventListener('click', handleRegister);
    
    const logoutItem = document.getElementById('dropdownLogoutItem');
    if (logoutItem) logoutItem.addEventListener('click', handleLogout);
    
    const loginItem = document.getElementById('dropdownLoginItem');
    if (loginItem) loginItem.addEventListener('click', () => uiManager.showAuthModal(true));
    
    const userBtn = document.getElementById('userBtn');
    if (userBtn) userBtn.addEventListener('click', () => {
        if (authSystem.isLoggedIn()) {
            uiManager.toggleDropdown();
        } else {
            uiManager.showAuthModal(true);
        }
    });
    
    // Google sign in button
    const googleBtn = document.getElementById('googleSignInBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            if (window.google?.accounts?.id) {
                window.google.accounts.id.prompt();
            }
        });
    }
    
    // Auth tabs
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            
            if (tabName === 'login') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            }
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.pen-btn-wrapper') && !e.target.closest('.header-actions')) {
            uiManager.closeDropdown();
        }
    });
    
    // Floating toolbar buttons
    const toolButtons = document.querySelectorAll('.floating-tool-btn');
    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            const prompt = uiManager.getToolPrompt(tool);
            if (prompt) {
                uiManager.setUserInputValue(prompt);
                uiManager.focusUserInput();
            }
        });
    });
    
    // Close modals
    window.closeAuthModal = function(e) {
        if (!e || e.target === document.getElementById('authOverlay')) {
            uiManager.showAuthModal(false);
        }
    };
    
    window.closeSessions = function(e) {
        if (e.target === document.getElementById('sessionsModal')) {
            uiManager.showSessionsModal(false);
        }
    };
}

// ============================================================
// Initialization
// ============================================================

async function init() {
    // Setup scroll handler
    uiManager.setupScrollHandler();
    
    // Restore session
    const restoredUser = authSystem.restoreSession();
    if (restoredUser) {
        uiManager.updateUserButton(true, restoredUser);
        uiManager.updateDropdownLoginState(true);
    }
    
    // Load sessions
    await loadUserSessions();
    
    // Create new chat session
    await chatManager.newSession();
    
    // Show welcome message
    uiManager.showWelcomeMessage();
    
    // Focus input
    uiManager.focusUserInput();
    
    // Setup event listeners
    setupEventListeners();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Firebase ready event
window.addEventListener('firebaseReady', () => {
    console.log('Firebase is ready');
});
