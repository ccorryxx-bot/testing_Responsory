import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDdoLASpM-r6i6iZOwwe1eE0fS4B4z6_n4",
    authDomain: "moonlight-xmaz-28e10.firebaseapp.com",
    projectId: "moonlight-xmaz-28e10",
    storageBucket: "moonlight-xmaz-28e10.firebasestorage.app",
    appId: "1:1042314863578:web:f2b20c89aa8b374f29d6e3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const cfgRef = doc(db, "moonlight_pro", "main_config");
const statsRef = doc(db, "moonlight_pro", "analytics");

let appData = {};
let statsData = {};
let adminPw = "2006";
let countdownTimer = null;
let moonClicks = 0, moonTimer = null;

window.haptic = (ms = 12) => {
    if (navigator.vibrate) navigator.vibrate(ms);
};

async function trackEvent(field) {
    try { await setDoc(statsRef, { [field]: increment(1) }, { merge: true }); } catch(e) { console.warn(e); }
}

trackEvent('pageViews');

onSnapshot(cfgRef, (snap) => {
    if (snap.exists()) {
        appData = snap.data();
        adminPw = appData.adminPw || "2006";
        syncUI();
    } else {
        setDoc(cfgRef, {
            title: "Lunar Radiance", titleColor: "#ffffff",
            sub: "ကြယ်စင်ခရစ္စမတ် *Moonlight Bonus* ရယူလိုက်ပါ။",
            codes: ["M89-XMAS-777", "GLOW-2424", "STAR999"],
            codeIndex: 0,
            img1: "https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=400",
            img2: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400",
            g1Link: "", g2Link: "", g3Link: "",
            adminPw: "2006", dlBase: 847
        });
    }
});

onSnapshot(statsRef, (snap) => {
    if (snap.exists()) { statsData = snap.data(); syncStats(); updateSocialProof(); }
});

let firstSync = false;
function syncUI() {
    document.getElementById('title-disp').innerText = appData.title || '';
    document.getElementById('title-disp').style.color = appData.titleColor || '#fff';
    document.getElementById('sub-disp').innerHTML = (appData.sub || '').replace(/\*(.*?)\*/g, "<b>$1</b>");
    document.getElementById('img1-disp').src = appData.img1 || '';
    document.getElementById('img2-disp').src = appData.img2 || '';
    document.getElementById('in-title').value = appData.title || '';
    document.getElementById('in-color').value = appData.titleColor || '#ffffff';
    document.getElementById('in-sub').value = appData.sub || '';
    document.getElementById('in-g1-link').value = appData.g1Link || '';
    document.getElementById('in-g2-link').value = appData.g2Link || '';
    document.getElementById('in-g3-link').value = appData.g3Link || '';
    document.getElementById('in-codes').value = (appData.codes || []).join('\n');
    document.getElementById('in-dl-base').value = appData.dlBase || 847;
    document.getElementById('pre1').src = appData.img1 || '';
    document.getElementById('pre2').src = appData.img2 || '';
    updateSocialProof();
    if (!firstSync) {
        firstSync = true;
        const skel = document.getElementById('skeleton-loader');
        const content = document.getElementById('main-content');
        skel.style.opacity = '0';
        setTimeout(() => {
            skel.style.display = 'none';
            content.classList.remove('hidden');
            content.classList.add('main-content');
            if (!localStorage.getItem('lunar_visited')) {
                localStorage.setItem('lunar_visited', '1');
                content.style.animation = 'fadeUp 0.5s ease';
            }
        }, 300);
    }
}

function syncStats() {
    const views = statsData.pageViews || 0;
    const gifts = statsData.giftTaps || 0;
    const g1 = statsData.g1Taps || 0;
    const g2 = statsData.g2Taps || 0;
    const g3 = statsData.g3Taps || 0;
    document.getElementById('s-views').innerText = views.toLocaleString();
    document.getElementById('s-gifts').innerText = gifts.toLocaleString();
    document.getElementById('s-dls').innerText = g1.toLocaleString();
    document.getElementById('s-plays').innerText = (g2 + g3).toLocaleString();
    const giftRate = views ? ((gifts / views) * 100).toFixed(1) : 0;
    const clickRate = gifts ? ((g1 / gifts) * 100).toFixed(1) : 0;
    document.getElementById('s-gift-bar').style.width = Math.min(giftRate, 100) + '%';
    document.getElementById('s-dl-bar').style.width = Math.min(clickRate, 100) + '%';
}

function updateSocialProof() {
    const base = appData.dlBase || 847;
    const totalClaims = (statsData.giftTaps || 0) + base;
    document.getElementById('social-proof').innerText = `👥 ${totalClaims.toLocaleString()}+ active`;
}

window.handleDraw = async () => {
    haptic(20);
    const codes = appData.codes || [];
    if (!codes.length) return;
    const idx = (appData.codeIndex ?? 0) % codes.length;
    document.getElementById('code-disp').innerText = codes[idx];
    document.getElementById('code-modal').style.display = 'flex';
    trackEvent('giftTaps');
    try { await setDoc(cfgRef, { ...appData, codeIndex: idx + 1 }); } catch(e) {}
};

window.openGame = (key) => {
    haptic(15);
    const map = { g1: appData.g1Link, g2: appData.g2Link, g3: appData.g3Link };
    const url = map[key];
    if (url?.trim()) {
        trackEvent(key + 'Taps');
        window.open(url.trim(), '_blank');
    } else showToast("Link မသတ်မှတ်ရသေးပါ ⚙️");
};

window.closeCodeModal = () => {
    document.getElementById('code-modal').style.display = 'none';
    if (countdownTimer) clearInterval(countdownTimer);
    document.getElementById('copy-countdown').innerText = '';
};

window.copyCode = () => {
    haptic(12);
    const txt = document.getElementById('code-disp').innerText;
    const doAfter = () => {
        showToast("Copied! ✓");
        let sec = 5;
        const cdSpan = document.getElementById('copy-countdown');
        cdSpan.innerText = ` (${sec}s)`;
        clearInterval(countdownTimer);
        countdownTimer = setInterval(() => {
            sec--;
            if (sec <= 0) {
                clearInterval(countdownTimer);
                cdSpan.innerText = '';
                closeCodeModal();
            } else cdSpan.innerText = ` (${sec}s)`;
        }, 1000);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).then(doAfter);
    else { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); doAfter(); }
};

window.showToast = (msg) => {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
};

window.moonTap = () => {
    haptic(8);
    moonClicks++;
    clearTimeout(moonTimer);
    if (moonClicks >= 3) {
        moonClicks = 0;
        const moon = document.getElementById('moon');
        moon.style.background = 'radial-gradient(circle at 30% 30%, #ffdd88, #ffaa33)';
        moon.style.boxShadow = '0 0 45px #ffc107';
        haptic(45);
        setTimeout(() => {
            moon.style.background = 'radial-gradient(circle at 30% 30%, #fffde7, #fff0b5)';
            moon.style.boxShadow = '0 0 20px rgba(255, 235, 140, 0.6)';
            toggleLogin();
        }, 300);
    } else {
        moonTimer = setTimeout(() => { moonClicks = 0; }, 800);
    }
};

window.toggleLogin = () => {
    const modal = document.getElementById('login-modal');
    modal.classList.toggle('hidden');
};
window.checkLogin = () => {
    const inputPw = document.getElementById('pin-input').value;
    if (inputPw === adminPw) {
        toggleLogin();
        document.getElementById('admin-dash').classList.remove('hidden');
        document.getElementById('pin-input').value = '';
    } else {
        showToast("Password မှားနေပါတယ် ❌");
        document.getElementById('pin-input').value = '';
    }
};
window.closeDash = () => document.getElementById('admin-dash').classList.add('hidden');
window.saveToCloud = async () => {
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) saveBtn.disabled = true;
    try {
        const newPw = document.getElementById('in-admin-pw').value.trim();
        await setDoc(cfgRef, {
            ...appData,
            title: document.getElementById('in-title').value,
            titleColor: document.getElementById('in-color').value,
            sub: document.getElementById('in-sub').value,
            g1Link: document.getElementById('in-g1-link').value.trim(),
            g2Link: document.getElementById('in-g2-link').value.trim(),
            g3Link: document.getElementById('in-g3-link').value.trim(),
            codes: document.getElementById('in-codes').value.split('\n').filter(c => c.trim()),
            codeIndex: 0,
            dlBase: parseInt(document.getElementById('in-dl-base').value) || 847,
            adminPw: newPw || appData.adminPw || "2006",
            img1: document.getElementById('pre1').src,
            img2: document.getElementById('pre2').src
        });
        showToast("Cloud Synced! ✓");
        document.getElementById('in-admin-pw').value = '';
        closeDash();
    } catch(e) { alert("Error: "+e.message); }
    finally { if(saveBtn) saveBtn.disabled = false; }
};
window.resetStats = async () => {
    if (!confirm("Analytics reset လုပ်မှာ သေချာပါသလား?")) return;
    try { await setDoc(statsRef, { pageViews:0, giftTaps:0, g1Taps:0, g2Taps:0, g3Taps:0 }); showToast("Reset ပြီ ✓"); } catch(e) {}
};
window.saveDlBase = async () => {
    const val = parseInt(document.getElementById('in-dl-base').value) || 847;
    try { await setDoc(cfgRef, { ...appData, dlBase: val }); showToast("Saved ✓"); } catch(e) {}
};
window.processImage = (input, preId) => {
    if (!input.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height, max = 500;
            if (w > max) { h *= max / w; w = max; }
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            document.getElementById(preId).src = canvas.toDataURL('image/jpeg', 0.5);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
};

function updateOnlineBanner() {
    const banner = document.getElementById('offline-banner');
    if (!navigator.onLine) banner.classList.add('show');
    else banner.classList.remove('show');
}
window.addEventListener('online', updateOnlineBanner);
window.addEventListener('offline', updateOnlineBanner);
updateOnlineBanner();

function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth, height = window.innerHeight;
    let particles = [];
    const PARTICLE_COUNT = 60;
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    function createParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2 + 1,
                alpha: Math.random() * 0.4 + 0.2,
                speedX: (Math.random() - 0.5) * 0.2,
                speedY: Math.random() * 0.6 + 0.2
            });
        }
    }
    function draw() {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        for (let p of particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 210, 170, ${p.alpha})`;
            ctx.fill();
            p.x += p.speedX;
            p.y -= p.speedY;
            if (p.y < 0) p.y = height;
            if (p.x > width) p.x = 0;
            if (p.x < 0) p.x = width;
        }
        requestAnimationFrame(draw);
    }
    window.addEventListener('resize', () => { resize(); createParticles(); });
    resize();
    createParticles();
    draw();
}
initParticles();
