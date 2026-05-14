// ============================================================
// CONFIGURATION FILE
// ============================================================

// API Configuration
export const API_KEY = "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";
export const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Professor Information
export const PROFESSOR_NAME = "أ.د محمد لبيب سالم";
export const PROFESSOR_TITLE = "أستاذ علم المناعة - جامعة طنطا";
export const PROFESSOR_HONOR = "رئيس الجمعية المصرية لأبحاث السرطان";
export const PROFESSOR_AVATAR = "https://i.ibb.co/nqjSTBjJ/Whats-App-Image-2026-05-14-at-10-58-27-PM.jpg";

// WhatsApp Number (Change this to the professor's real number)
export const WHATSAPP_NUMBER = "201101962166";

// Developer Info
export const EACR_INFO = { 
    website: "https://earc-eg.github.io/2026/", 
    developer: "ELGOHARYX" 
};

// Firebase Configuration
export const firebaseConfig = {
    apiKey: "AIzaSyDWbNnsm1xpaanEkypEEvjrHHosNj713YY",
    authDomain: "commnt-a9855.firebaseapp.com",
    projectId: "commnt-a9855",
    storageBucket: "commnt-a9855.firebasestorage.app",
    messagingSenderId: "1077378702730",
    appId: "1:1077378702730:web:d0fece55ac909fb7ac3c73"
};

// Tool Prompts
export const TOOL_PROMPTS = {
    analyze: 'ما هي أساسيات علم المناعة؟ وما هي أهميته في التشخيص الطبي؟',
    cells: 'اشرح بالتفصيل أنواع خلايا المناعة (اللمفاوية T، B، الخلايا القاتلة الطبيعية، الخلايا المتغصنة) ودور كل منها في الاستجابة المناعية.',
    diseases: 'ما هي أمراض المناعة الذاتية الأكثر شيوعاً؟ وكيف يمكن تشخيصها وعلاجها؟',
    therapy: 'ما هي أحدث العلاجات المناعية للأورام والسرطانات؟ اشرح آلية عمل الـ Checkpoint inhibitors و CAR-T.',
    textbooks: 'ما هي أهم المراجع العلمية والكتب في علم المناعة التي تنصح بها للباحثين وطلاب الدراسات العليا؟',
    conference: 'ما هي أحدث الأبحاث والاتجاهات في مجال المناعة وأبحاث السرطان حسب المؤتمرات العلمية الأخيرة؟'
};

// Allowed Languages Regex (Arabic & English only)
export const ALLOWED_LANGUAGE_REGEX = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z0-9\s\.,!?;:()\-_'"@#\$%&*+=/\\|~`{}[\]<>،؛؟\u061F\u061B\u066B\u066C\u060C\s]+$/;
