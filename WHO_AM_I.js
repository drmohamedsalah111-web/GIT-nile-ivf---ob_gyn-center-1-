// 🛠️ DIAGNOSTIC SCRIPT: WHO AM I?
// Copy and paste this into your browser console (F12 -> Console)

(async () => {
    console.clear();
    console.log('%c🕵️ WHO AM I?', 'color: #00bcd4; font-size: 20px; font-weight: bold;');

    const sbKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!sbKey) {
        console.error('❌ No session found in LocalStorage!');
        return;
    }

    const session = JSON.parse(localStorage.getItem(sbKey));
    const user = session.user;

    console.log('🆔 User ID:', user.id);
    console.log('📧 Email:', user.email);
    console.log('📅 Last Sign In:', user.last_sign_in_at);
    
    console.log('%c📋 COPY THIS ID AND EMAIL AND PASTE IT IN THE CHAT', 'color: yellow; font-size: 14px;');
    console.log(`${user.id} | ${user.email}`);
})();
