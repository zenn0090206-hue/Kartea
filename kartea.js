// ================================
// PAGE SWITCHING
// ================================
function switchPage(pageId) {
    document.querySelectorAll('.page-section').forEach(p => p.style.display = 'none');
    const page = document.getElementById(pageId);
    if (page) page.style.display = 'block';
    window.scrollTo(0, 0);
}

// ================================
// PER-USER KEY HELPER
// ================================
function userKey(key) {
    const email = getCurrentUser();
    return email ? `${email}__${key}` : key;
}

// ================================
// AUTH FUNCTIONS
// ================================
function togglePassword(inputId = "password", eyeElement = null) {
    const password = document.getElementById(inputId);
    const eye = eyeElement || document.querySelector(".toggle-eye");
    if (!password || !eye) return;
    const isHidden = password.type === "password";
    password.type = isHidden ? "text" : "password";
    eye.src = isHidden ? "preview-show-interface-icon-free-vector.jpg" : "eye-close-1.png";
    eye.alt = isHidden ? "Hide password" : "Show password";
}

function login(event) {
    event.preventDefault();
    const errorEl = document.getElementById('error-message');
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();
    if (errorEl) errorEl.innerText = '';

    const user = findUser(email, password);
    if (user) {
        const role = user.role || 'user';
        setRole(role); setCurrentUser(email);
        loadCart(); updateCartIndicator(); renderCartBox();
        if (errorEl) errorEl.innerText = `${role.charAt(0).toUpperCase() + role.slice(1)} login successful — redirecting...`;
        setTimeout(() => {
            if (role === 'admin') { switchPage('admin-page'); if (typeof updateUsersList !== 'undefined') updateUsersList(); }
            else { switchPage('shop-page'); }
        }, 500);
        return;
    }
    if (email === "admin@gmail.com" && password === "admin123") {
        setRole('admin'); setCurrentUser(email);
        if (errorEl) errorEl.innerText = 'Admin login successful — redirecting...';
        setTimeout(() => { switchPage('admin-page'); if (typeof updateUsersList !== 'undefined') updateUsersList(); }, 500);
        return;
    }
    if (errorEl) errorEl.innerText = "Invalid login credentials. If you don't have an account, sign up first.";
}

function register(event) {
    event.preventDefault();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value.trim();
    const confirm = document.getElementById('signup-confirm').value.trim();
    if (!email || !password || !confirm) { alert('Please fill in all fields.'); return; }
    if (password !== confirm) { alert('Passwords do not match.'); return; }
    if (email === 'admin@gmail.com') { alert('This email is reserved.'); return; }
    if (getUsers().find(u => u.email === email)) { alert('This email is already registered. Please log in.'); return; }
    addUser({ email, password, role: 'user' });
    alert('Your account has been created. You can now log in.');
    document.getElementById('signupForm').reset();
    switchPage('login-page');
}

function getUsers() {
    try { return JSON.parse(localStorage.getItem('users') || '[]'); } catch { return []; }
}
function setUsers(users) { localStorage.setItem('users', JSON.stringify(users)); }
function addUser(user) { const u = getUsers(); u.push(user); setUsers(u); }
function findUser(email, password) { return getUsers().find(u => u.email === email && u.password === password); }
function setRole(role) { localStorage.setItem('role', role); }
function getRole() { return localStorage.getItem('role'); }
function setCurrentUser(email) { localStorage.setItem('currentUser', email); }
function getCurrentUser() { return localStorage.getItem('currentUser'); }
function getLoginStatusText() {
    const role = getRole(), email = getCurrentUser();
    if (!role || !email) return 'Not logged in yet.';
    return `Logged in as ${role} (${email})`;
}

function logout() {
    cartCounts = {};
    updateCartIndicator();
    renderCartBox();
    localStorage.removeItem('role');
    localStorage.removeItem('currentUser');
    switchPage('login-page');
    const emailEl = document.getElementById('email');
    const pwEl = document.getElementById('password');
    if (emailEl) emailEl.value = '';
    if (pwEl) pwEl.value = '';
}

// ================================
// PROFILE MENU (header dropdown)
// ================================
function closeProfileMenu() {
    const menu = document.getElementById('profileMenu');
    if (menu) menu.classList.remove('open');
    const btn = document.getElementById('profileBtn');
    if (btn) btn.setAttribute('aria-expanded', false);
}

document.addEventListener('DOMContentLoaded', () => {
    const profileBtn = document.getElementById('profileBtn');
    const profileMenu = document.getElementById('profileMenu');
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = profileMenu.classList.toggle('open');
            profileBtn.setAttribute('aria-expanded', isOpen);
        });
        document.addEventListener('click', (e) => {
            if (!profileMenu.contains(e.target) && e.target !== profileBtn) closeProfileMenu();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeProfileMenu();
        });
    }
});

// ================================
// ACCOUNT: CHANGE PASSWORD
// ================================
function changePassword() {
    const cur = document.getElementById('currentPw')?.value;
    const nw  = document.getElementById('newPw')?.value;
    const cnf = document.getElementById('confirmPw')?.value;
    if (!cur || !nw || !cnf) { showProfileToast('Please fill in all fields.'); return; }
    if (nw !== cnf) { showProfileToast('Passwords do not match.'); return; }
    if (nw.length < 6) { showProfileToast('Password must be at least 6 characters.'); return; }
    const email = getCurrentUser();
    const users = getUsers();
    const userIndex = users.findIndex(u => u.email === email);
    if (userIndex !== -1) {
        if (users[userIndex].password !== cur) { showProfileToast('Current password is incorrect.'); return; }
        users[userIndex].password = nw;
        setUsers(users);
    }
    document.getElementById('currentPw').value = '';
    document.getElementById('newPw').value = '';
    document.getElementById('confirmPw').value = '';
    showProfileToast('✓ Password updated successfully!');
}

// ================================
// ACCOUNT: THEME
// ================================
function setTheme(theme) {
    const root = document.documentElement;
    root.removeAttribute('data-theme');
    if (theme === 'dark')  root.setAttribute('data-theme', 'dark');
    if (theme === 'white') root.setAttribute('data-theme', 'white');
    document.querySelectorAll('.theme-opt').forEach(el => el.classList.remove('active'));
    const btn = document.getElementById('theme-' + theme);
    if (btn) btn.classList.add('active');
    localStorage.setItem('savedTheme', theme);
    showProfileToast('Theme changed to ' + theme.charAt(0).toUpperCase() + theme.slice(1));
}

function loadSavedTheme() {
    const saved = localStorage.getItem('savedTheme') || 'warm';
    setTheme(saved);
}

// ================================
// TOAST (shared)
// ================================
let toastTimer;
function showProfileToast(msg) {
    clearTimeout(toastTimer);
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

// ================================
// CART FUNCTIONS
// ================================
const CART_KEY = 'cartCounts';
let cartCounts = {};

function loadCart() {
    let dirty = false;
    try {
        const stored = localStorage.getItem(userKey(CART_KEY));
        cartCounts = stored ? JSON.parse(stored) : {};
    } catch (e) { cartCounts = {}; }
    for (const key of Object.keys(cartCounts)) {
        const entry = cartCounts[key];
        if (!String(key).trim() || !entry || typeof entry !== 'object') { delete cartCounts[key]; dirty = true; continue; }
        if (isNaN(entry.price)) { entry.price = 0; dirty = true; }
        if (isNaN(entry.count)) { entry.count = 0; dirty = true; }
        if (entry.count === 0 && entry.price === 0) { delete cartCounts[key]; dirty = true; }
    }
    if (dirty) saveCart();
}

function saveCart() { localStorage.setItem(userKey(CART_KEY), JSON.stringify(cartCounts)); }

function updateCartIndicator() {
    const total = Object.values(cartCounts).reduce((sum, item) => sum + (Number(item.count) || 0), 0);
    const span = document.getElementById('cart-count');
    if (span) span.textContent = total;
    const checkout = document.getElementById('checkout-btn');
    if (checkout) checkout.disabled = total === 0;
}

function renderCartBox() {
    const box = document.getElementById('cart-box');
    if (!box) return;
    const itemsDiv = box.querySelector('.cart-items');
    itemsDiv.innerHTML = '';
    let totalCost = 0;
    for (const [title, data] of Object.entries(cartCounts)) {
        const count = Number(data.count) || 0;
        if (count === 0) continue;
        const unitPrice = Number(data.price) || 0;
        const lineTotal = unitPrice * count;
        const line = document.createElement('div');
        line.className = 'cart-item';
        const nameSpan = document.createElement('span'); nameSpan.textContent = `${title} x${count}`; line.appendChild(nameSpan);
        const unitSpan = document.createElement('span'); unitSpan.className = 'unit-price'; unitSpan.textContent = `@₱${unitPrice.toFixed(2)}`; line.appendChild(unitSpan);
        const totalSpan = document.createElement('span'); totalSpan.className = 'line-total'; totalSpan.textContent = `= ₱${lineTotal.toFixed(2)}`; line.appendChild(totalSpan);
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn'; removeBtn.setAttribute('aria-label', `Remove ${title}`); removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => { e.stopPropagation(); removeFromCart(title); });
        line.appendChild(removeBtn);
        itemsDiv.appendChild(line);
        totalCost += lineTotal;
    }
    if (isNaN(totalCost)) totalCost = 0;
    const tax = totalCost * 0.12;
    const finalTotal = totalCost + tax;
    const s = document.getElementById('cart-subtotal'); if (s) s.textContent = totalCost.toFixed(2);
    const tx = document.getElementById('cart-tax'); if (tx) tx.textContent = tax.toFixed(2);
    const tot = document.getElementById('cart-total'); if (tot) tot.textContent = finalTotal.toFixed(2);
}

function toggleCartBox(show) {
    const box = document.getElementById('cart-box');
    if (!box) return;
    if (show === undefined) show = !box.classList.contains('show');
    box.classList.toggle('show', show);
}

function removeFromCart(title) {
    if (cartCounts[title]) { delete cartCounts[title]; saveCart(); updateCartIndicator(); renderCartBox(); }
}

// Close cart on outside click
document.addEventListener('click', (e) => {
    const box = document.getElementById('cart-box');
    const indicator = document.querySelector('.cart-indicator');
    if (!box || !box.classList.contains('show')) return;
    if (box.contains(e.target) || (indicator && indicator.contains(e.target))) return;
    toggleCartBox(false);
});

// Add to Cart delegation
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-add-cart');
    if (!btn) return;
    const overlay = document.getElementById('overlay');
    if (overlay && overlay.classList.contains('show')) { overlay.classList.remove('show'); overlay.setAttribute('aria-hidden', 'true'); }
    const itemFrame = btn.closest('.item-frame');
    if (!itemFrame) return;
    const title = (itemFrame.querySelector('.item-title')?.textContent || '').trim();
    const priceText = itemFrame.querySelector('.item-price')?.textContent || '';
    const parsed = parseFloat(priceText.replace(/[^\d.]/g, ''));
    const priceVal = isNaN(parsed) ? 0 : parsed;
    if (!title || priceVal === 0) return;
    cartCounts[title] = cartCounts[title] || { count: 0, price: priceVal };
    cartCounts[title].count++;
    saveCart(); updateCartIndicator(); renderCartBox();
    btn.textContent = '✓ Added!';
    setTimeout(() => { btn.textContent = 'Add to Cart'; }, 1500);
});

// Init cart on load
loadCart(); updateCartIndicator(); renderCartBox();

// Cart indicator, close, and checkout
document.addEventListener('DOMContentLoaded', () => {
    const ci = document.querySelector('.cart-indicator');
    if (ci) ci.addEventListener('click', () => toggleCartBox());
    const cb = document.getElementById('cart-close');
    if (cb) cb.addEventListener('click', () => toggleCartBox(false));

    // Checkout
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const total = document.getElementById('cart-total')?.textContent;
            if (total && total !== '0.00') {
                const receiptItems = [];
                let subtotal = 0;
                for (const [title, data] of Object.entries(cartCounts)) {
                    const count = Number(data.count) || 0;
                    if (count > 0) {
                        const unitPrice = Number(data.price) || 0;
                        const lineTotal = unitPrice * count;
                        receiptItems.push({ name: title, quantity: count, unitPrice, lineTotal });
                        subtotal += lineTotal;
                    }
                }

                // Save receipt items for the receipt page
                localStorage.setItem(userKey('receiptItems'), JSON.stringify(receiptItems));

                // ── Save to Order History (per user) ──
                const tax = subtotal * 0.12;
                const grandTotal = subtotal + tax;
                const newOrder = {
                    id: 'ORD-' + Date.now(),
                    date: new Date().toLocaleString(),
                    items: receiptItems,
                    itemCount: receiptItems.reduce((s, i) => s + i.quantity, 0),
                    total: grandTotal
                };
                const history = getOrderHistory();
                history.unshift(newOrder); // newest first
                localStorage.setItem(userKey('orderHistory'), JSON.stringify(history));

                // Clear cart
                cartCounts = {}; saveCart(); updateCartIndicator(); renderCartBox(); toggleCartBox(false);
                displayReceipt(); switchPage('receipt-page');
            } else { alert('Your cart is empty!'); }
        });
    }

    // Load saved theme
    loadSavedTheme();

    // Auth check
    const role = getRole(), email = getCurrentUser();
    const statusEl = document.getElementById('role-status');
    if (statusEl) statusEl.innerText = getLoginStatusText();
    const statusAdmin = document.getElementById('role-status-admin');
    if (statusAdmin) statusAdmin.innerText = getLoginStatusText();

    if (role === 'admin' && email) {
        switchPage('admin-page');
        if (typeof updateUsersList !== 'undefined') updateUsersList();
    } else if (role === 'user' && email) {
        loadCart(); updateCartIndicator(); renderCartBox();
        switchPage('shop-page');
    } else {
        switchPage('login-page');
    }
});

// ================================
// ORDER HISTORY
// ================================
function getOrderHistory() {
    try { return JSON.parse(localStorage.getItem(userKey('orderHistory')) || '[]'); } catch { return []; }
}

function renderOrderHistory() {
    const list = document.getElementById('order-history-list');
    const clearBtn = document.getElementById('clear-history-btn');
    if (!list) return;

    const orders = getOrderHistory();

    // Show/hide clear button depending on whether there are orders
    if (clearBtn) clearBtn.style.display = orders.length === 0 ? 'none' : 'inline-flex';

    if (orders.length === 0) {
        list.innerHTML = `
            <div style="padding: 40px 0; text-align: center;">
                <i class="fas fa-receipt" style="font-size: 48px; color: var(--text-muted); display: block; margin-bottom: 14px;"></i>
                <p style="color: var(--text-muted); font-size: 14px;">No orders yet. Start shopping!</p>
            </div>`;
        return;
    }

    list.innerHTML = orders.map(order => {
        const itemSummary = order.items
            .map(i => `${i.name} × ${i.quantity}`)
            .join(' &nbsp;·&nbsp; ');

        return `
        <div class="order-card">
            <div class="order-top">
                <div>
                    <div class="order-id">#${order.id}</div>
                    <div class="order-date">${order.date}</div>
                </div>
                <span class="obadge delivered">Delivered</span>
            </div>
            <div class="order-items-text">${itemSummary}</div>
            <div class="order-footer">
                <div class="order-count">${order.itemCount} item${order.itemCount !== 1 ? 's' : ''}</div>
                <div class="order-total-amt">₱ ${order.total.toFixed(2)}</div>
            </div>
        </div>`;
    }).join('');
}

function clearOrderHistory() {
    if (!confirm('Clear all order history? This cannot be undone.')) return;
    localStorage.removeItem(userKey('orderHistory'));
    renderOrderHistory();
    showProfileToast('Order history cleared.');
}

// ================================
// SEARCH
// ================================
(function () {
    const form = document.querySelector('.search-bar');
    const input = document.querySelector('.search-input');
    if (!form || !input) return;

    form.addEventListener('submit', function(e) { e.preventDefault(); filterItems(input.value); });
    input.addEventListener('input', function() { filterItems(this.value); });

    function filterItems(query) {
        const term = query.trim().toLowerCase();
        const sections = document.querySelectorAll('section.category');
        if (term === '') {
            const activeTab = document.querySelector('.category-tab.active');
            if (activeTab) activeTab.click();
            return;
        }
        sections.forEach(section => {
            section.style.display = 'block';
            let hasMatch = false;
            section.querySelectorAll('.item-frame').forEach(frame => {
                const title = frame.querySelector('.item-title')?.textContent.toLowerCase() || '';
                if (title.includes(term)) { frame.classList.remove('hidden'); hasMatch = true; }
                else { frame.classList.add('hidden'); }
            });
            if (!hasMatch) section.style.display = 'none';
        });
    }
})();

// ================================
// CATEGORY TABS
// ================================
(function () {
    const tabs = document.querySelectorAll('.category-tab');
    if (tabs.length === 0) return;
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const input = document.querySelector('.search-input');
            if (input) input.value = '';
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const filter = this.getAttribute('data-filter');
            document.querySelectorAll('section.category').forEach(section => {
                if (filter === 'all') {
                    section.style.display = 'block';
                    section.querySelectorAll('.item-frame').forEach(f => f.classList.remove('hidden'));
                } else {
                    if (section.classList.contains(filter)) {
                        section.style.display = 'block';
                        section.querySelectorAll('.item-frame').forEach(f => f.classList.remove('hidden'));
                    } else {
                        section.style.display = 'none';
                    }
                }
            });
        });
    });
    tabs[0].click();
})();

// ================================
// SIDEBAR
// ================================
(function () {
    const btn = document.querySelector('.toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (!btn || !sidebar || !overlay) return;

    function isMobile() { return window.matchMedia('(max-width: 768px)').matches; }
    function closeSidebar() {
        sidebar.classList.remove('open'); overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true'); btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false');
        const h = (e) => { if (e.propertyName.includes('transform')) { sidebar.classList.remove('overlay-open'); sidebar.removeEventListener('transitionend', h); } };
        sidebar.addEventListener('transitionend', h);
    }
    function openSidebar() {
        sidebar.classList.add('overlay-open'); void sidebar.offsetWidth; sidebar.classList.add('open');
        overlay.classList.add('show'); overlay.setAttribute('aria-hidden', 'false'); btn.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
    }
    btn.addEventListener('click', () => { sidebar.classList.contains('open') ? closeSidebar() : openSidebar(); });
    overlay.addEventListener('click', closeSidebar);
    window.addEventListener('resize', () => { if (!isMobile() && sidebar.classList.contains('open')) closeSidebar(); });
})();

// ================================
// RECEIPT FUNCTIONS
// ================================
function getItems() {
    try { return JSON.parse(localStorage.getItem(userKey('receiptItems')) || '[]'); } catch { return []; }
}

function displayReceipt() {
    const items = getItems();
    const container = document.getElementById('receipt-items');
    if (!container) return;
    container.innerHTML = '';
    let subtotal = 0;
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'receipt-item';
        div.innerHTML = `<div class="receipt-item-name">${item.name} x${item.quantity}</div><div class="receipt-item-price">₱${item.lineTotal.toFixed(2)}</div>`;
        container.appendChild(div);
        subtotal += item.lineTotal;
    });
    const tax = subtotal * 0.12;
    const grandTotal = subtotal + tax;
    const dateEl = document.getElementById('receipt-date');
    if (dateEl) dateEl.textContent = new Date().toLocaleString();
    const totalEl = document.getElementById('grand-total');
    if (totalEl) totalEl.textContent = grandTotal.toFixed(2);
}