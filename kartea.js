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

// FIXED: handles both <img> and <i class="toggle-eye"> elements
function togglePassword(inputId = "password", eyeElement = null) {
    const password = document.getElementById(inputId);
    const eye = eyeElement || document.querySelector(".toggle-eye");
    if (!password || !eye) return;
    const isHidden = password.type === "password";
    password.type = isHidden ? "text" : "password";
    if (eye.tagName === 'I') {
        // Font Awesome icon toggle
        eye.classList.toggle('fa-eye-slash', !isHidden);
        eye.classList.toggle('fa-eye', isHidden);
    } else {
        // Legacy <img> fallback
        eye.src = isHidden ? "eye-open.png" : "eye-close.png";
        eye.alt = isHidden ? "Hide password" : "Show password";
    }
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
        loadFavorites(); syncFavButtons();
        const statusEl = document.getElementById('role-status');
        if (statusEl) statusEl.innerText = getLoginStatusText();
        if (errorEl) errorEl.innerText = `Welcome back, @${user.username || email.split('@')[0]}! Redirecting...`;
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
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value.trim();
    const confirm = document.getElementById('signup-confirm').value.trim();
    if (!username || !email || !password || !confirm) { alert('Please fill in all fields.'); return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) { alert('Username must be 3–20 characters, letters/numbers/underscore only.'); return; }
    if (password !== confirm) { alert('Passwords do not match.'); return; }
    if (email === 'admin@gmail.com') { alert('This email is reserved.'); return; }
    if (getUsers().find(u => u.email === email)) { alert('This email is already registered. Please log in.'); return; }
    if (getUsers().find(u => u.username && u.username.toLowerCase() === username.toLowerCase())) {
        alert('That username is already taken. Please choose another.'); return;
    }
    addUser({ email, password, role: 'user', username });
    alert('Your account has been created. You can now log in.');
    document.getElementById('signupForm').reset();
    switchPage('login-page');
}

// Real-time username availability check
document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('signup-username');
    if (usernameInput) {
        usernameInput.addEventListener('input', function() {
            const val = this.value.trim();
            const statusEl = document.getElementById('username-status');
            if (!statusEl) return;
            if (!val) { statusEl.textContent = ''; return; }
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(val)) {
                statusEl.textContent = 'Only letters, numbers, underscore. 3–20 chars.';
                statusEl.style.color = 'var(--danger)';
                return;
            }
            const taken = getUsers().find(u => u.username && u.username.toLowerCase() === val.toLowerCase());
            if (taken) {
                statusEl.textContent = '✗ Username already taken';
                statusEl.style.color = 'var(--danger)';
            } else {
                statusEl.textContent = '✓ Username available';
                statusEl.style.color = 'var(--success)';
            }
        });
    }
});

// ================================
// USERNAME HELPERS
// ================================
function getCurrentUsername() {
    const email = getCurrentUser();
    if (!email) return '';
    if (email === 'admin@gmail.com') return 'Admin';
    const user = getUsers().find(u => u.email === email);
    return user?.username || email.split('@')[0];
}

function changeUsername() {
    const newVal = document.getElementById('newUsername')?.value.trim();
    const statusEl = document.getElementById('new-username-status');
    if (!newVal) { if (statusEl) { statusEl.textContent = 'Please enter a username.'; statusEl.style.color = 'var(--danger)'; } return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(newVal)) {
        if (statusEl) { statusEl.textContent = 'Only letters, numbers, underscore. 3–20 chars.'; statusEl.style.color = 'var(--danger)'; } return;
    }
    const email = getCurrentUser();
    const users = getUsers();
    const taken = users.find(u => u.email !== email && u.username && u.username.toLowerCase() === newVal.toLowerCase());
    if (taken) {
        if (statusEl) { statusEl.textContent = '✗ Username already taken.'; statusEl.style.color = 'var(--danger)'; } return;
    }
    const idx = users.findIndex(u => u.email === email);
    if (idx !== -1) { users[idx].username = newVal; setUsers(users); }
    if (statusEl) { statusEl.textContent = ''; }
    document.getElementById('newUsername').value = '';
    document.getElementById('current-username-display').textContent = '@' + newVal;
    showProfileToast('✓ Username updated to @' + newVal);
}

function initAccountPage() {
    const display = document.getElementById('current-username-display');
    if (display) display.textContent = '@' + getCurrentUsername();
    const inp = document.getElementById('newUsername');
    const st = document.getElementById('new-username-status');
    if (inp && st) {
        inp.oninput = function() {
            const val = this.value.trim();
            if (!val) { st.textContent = ''; return; }
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(val)) {
                st.textContent = 'Only letters, numbers, underscore. 3–20 chars.';
                st.style.color = 'var(--danger)'; return;
            }
            const email = getCurrentUser();
            const taken = getUsers().find(u => u.email !== email && u.username && u.username.toLowerCase() === val.toLowerCase());
            st.textContent = taken ? '✗ Username already taken' : '✓ Available';
            st.style.color = taken ? 'var(--danger)' : 'var(--success)';
        };
    }
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
    const user = getUsers().find(u => u.email === email);
    const username = user?.username || email.split('@')[0];
    return `Logged in as @${username}`;
}

function logout() {
    cartCounts = {};
    favorites = {};
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
    // Force default dark theme and clear any previous saved preference.
    localStorage.setItem('savedTheme', 'dark');
    setTheme('dark');
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
        line.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${title}</div>
                <div class="cart-item-unit">₱${unitPrice.toFixed(2)} each</div>
            </div>
            <div class="cart-item-right">
                <div class="cart-qty-controls">
                    <button class="cart-qty-btn cart-qty-minus" aria-label="Decrease">−</button>
                    <span class="cart-qty-num">${count}</span>
                    <button class="cart-qty-btn cart-qty-plus" aria-label="Increase">+</button>
                </div>
                <div class="cart-line-total">₱${lineTotal.toFixed(2)}</div>
            </div>`;

        line.querySelectorAll('.cart-qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (btn.classList.contains('cart-qty-minus')) {
                    cartCounts[title].count--;
                    if (cartCounts[title].count <= 0) delete cartCounts[title];
                } else {
                    cartCounts[title].count++;
                }
                saveCart(); updateCartIndicator(); renderCartBox();
            });
        });

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

// Qty stepper on item cards (− / +)
document.addEventListener('click', function(e) {
    const dec = e.target.closest('.qty-dec');
    const inc = e.target.closest('.qty-inc');
    if (!dec && !inc) return;
    e.stopPropagation();
    const frame = (dec || inc).closest('.item-frame');
    if (!frame) return;
    const numEl = frame.querySelector('.qty-num');
    if (!numEl) return;
    let val = parseInt(numEl.textContent) || 1;
    if (inc) val = Math.min(val + 1, 99);
    if (dec) val = Math.max(val - 1, 1);
    numEl.textContent = val;
});

// Add to Cart — reads qty from the stepper
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-add-cart');
    if (!btn) return;
    const itemFrame = btn.closest('.item-frame');
    if (!itemFrame) return;
    const title = (itemFrame.querySelector('.item-title')?.textContent || '').trim();
    const priceText = itemFrame.querySelector('.item-price')?.textContent || '';
    const parsed = parseFloat(priceText.replace(/[^\d.]/g, ''));
    const priceVal = isNaN(parsed) ? 0 : parsed;
    const qtyEl = itemFrame.querySelector('.qty-num');
    const qty = qtyEl ? (parseInt(qtyEl.textContent) || 1) : 1;
    if (!title || priceVal === 0) return;

    cartCounts[title] = cartCounts[title] || { count: 0, price: priceVal };
    cartCounts[title].count += qty;
    saveCart(); updateCartIndicator(); renderCartBox();

    if (qtyEl) qtyEl.textContent = '1';

    btn.textContent = `✓ Added ${qty}!`;
    btn.disabled = true;
    setTimeout(() => { btn.textContent = 'Add to Cart'; btn.disabled = false; }, 1400);
});

// Init menu item images (public fallback)
function populateMenuImages() {
    const categoryMap = {
        coffee: { folder:'coffee', ext:'png' },
        icetea: { folder:'icetea', ext:'png' },
        hottea: { folder:'hottea', ext:'png' },
        milktea: { folder:'milktea', ext:'jpg' },
        frappe: { folder:'frappe', ext:'jpg' }
    };

    document.querySelectorAll('section.category').forEach(section => {
        const sectionClass = Object.keys(categoryMap).find(c => section.classList.contains(c));
        if (!sectionClass) return;
        const { folder, ext } = categoryMap[sectionClass];

        section.querySelectorAll('.item-frame').forEach((frame, index) => {
            if (index >= 6) return;
            const img = frame.querySelector('.item-image');
            if (!img) return;
            if (sectionClass === 'hottea' && index === 5) {
                img.src = 'hottea4.png';
            } else {
                img.src = `${folder}${index + 1}.${ext}`;
            }
            img.alt = img.alt || `${sectionClass} ${index + 1}`;
            img.onerror = () => { img.src = `placeholder.jpg`; };
        });
    });
}

// Init cart on load
loadCart(); updateCartIndicator(); renderCartBox();
populateMenuImages();

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

                localStorage.setItem(userKey('receiptItems'), JSON.stringify(receiptItems));

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
                history.unshift(newOrder);
                localStorage.setItem(userKey('orderHistory'), JSON.stringify(history));

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
        loadFavorites(); syncFavButtons();
        switchPage('shop-page');
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
            const activeSide = document.querySelector('.sidebar-item.active, .mobile-tab.active');
            if (activeSide) activeSide.click();
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
// SIDEBAR NAV + MOBILE TABS
// ================================
(function () {
    const CATEGORIES = [
        { filter: 'all',      label: 'All Drinks',   icon: '☕' },
        { filter: 'coffee',   label: 'Coffee',        icon: '☕' },
        { filter: 'icetea',   label: 'Ice Tea',       icon: '🧊' },
        { filter: 'hottea',   label: 'Hot Tea',       icon: '🍵' },
        { filter: 'milktea',  label: 'Milk Tea',      icon: '🧋' },
        { filter: 'frappe',   label: 'Frappe',        icon: '🥤' },
    ];

    function filterItems(filter) {
        document.querySelectorAll('.sidebar-item[data-filter], .mobile-tab[data-filter]').forEach(el => {
            el.classList.toggle('active', el.dataset.filter === filter);
        });

        if (filter === 'favorites') {
            switchPage('favorites-page');
            renderFavoritesPage();
            return;
        }

        if (filter === 'feedback') {
            switchPage('feedback-page');
            initFeedbackPage();
            return;
        }

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

        const input = document.querySelector('.search-input');
        if (input) input.value = '';
    }

    function buildSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        const favCount = typeof getFavCount === 'function' ? getFavCount() : 0;

        sidebar.innerHTML = `
            <div class="sidebar-group">
                <div class="sidebar-group-label">Saved</div>
                <button class="sidebar-item" data-filter="favorites">
                    <span class="sidebar-icon">♥</span>
                    Favorites
                    <span class="sidebar-fav-badge" id="sidebar-fav-badge" style="display:${favCount > 0 ? 'flex' : 'none'}">${favCount}</span>
                </button>
                <button class="sidebar-item" data-filter="feedback">
                    <span class="sidebar-icon">💬</span>
                    Feedback
                </button>
            </div>
            <div class="sidebar-group sidebar-feedback-group">
                <div class="sidebar-group-label">What Others Say</div>
                <div id="sidebar-feedback-list"></div>
            </div>
            <div class="sidebar-group">
                <div class="sidebar-group-label">Drinks</div>
                ${CATEGORIES.map(c => `
                    <button class="sidebar-item${c.filter === 'all' ? ' active' : ''}" data-filter="${c.filter}">
                        <span class="sidebar-icon">${c.icon}</span>
                        ${c.label}
                    </button>
                `).join('')}
            </div>
        `;

        sidebar.querySelectorAll('.sidebar-item').forEach(btn => {
            btn.addEventListener('click', () => filterItems(btn.dataset.filter));
        });

        if (typeof renderSidebarFeedback === 'function') renderSidebarFeedback();
    }

    function buildMobileTabs() {
        const container = document.getElementById('mobile-tabs');
        if (!container) return;

        const favCount = typeof getFavCount === 'function' ? getFavCount() : 0;

        const items = [
            { filter: 'favorites', label: '♥ Favorites' },
            ...CATEGORIES
        ];

        container.innerHTML = items.map(c =>
            `<button class="mobile-tab${c.filter === 'all' ? ' active' : ''}" data-filter="${c.filter}">
                ${c.filter === 'favorites' ? `♥ Favorites${favCount > 0 ? ` (${favCount})` : ''}` : c.label}
            </button>`
        ).join('');

        container.querySelectorAll('.mobile-tab').forEach(btn => {
            btn.addEventListener('click', () => filterItems(btn.dataset.filter));
        });
    }

    function init() {
        buildSidebar();
        buildMobileTabs();
        filterItems('all');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.refreshNavBadges = function () {
        const count = typeof getFavCount === 'function' ? getFavCount() : 0;
        const sb = document.getElementById('sidebar-fav-badge');
        if (sb) { sb.textContent = count; sb.style.display = count > 0 ? 'flex' : 'none'; }
        const mt = document.querySelector('.mobile-tab[data-filter="favorites"]');
        if (mt) mt.textContent = `♥ Favorites${count > 0 ? ` (${count})` : ''}`;
    };
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

// ================================
// FAVORITES
// ================================
const FAV_KEY = 'favorites';
let favorites = {};

function loadFavorites() {
    try {
        const stored = localStorage.getItem(userKey(FAV_KEY));
        favorites = stored ? JSON.parse(stored) : {};
    } catch { favorites = {}; }
}

function saveFavorites() {
    localStorage.setItem(userKey(FAV_KEY), JSON.stringify(favorites));
}

function getFavCount() {
    return Object.keys(favorites).length;
}

function updateFavIndicator() {
    const badge = document.getElementById('fav-count-badge');
    const count = getFavCount();
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function toggleFavorite(title, price, imgSrc) {
    if (favorites[title]) {
        delete favorites[title];
        showProfileToast(`💔 Removed from favorites`);
    } else {
        favorites[title] = { price, img: imgSrc || '' };
        showProfileToast(`♥ Added to favorites!`);
    }
    saveFavorites();
    updateFavIndicator();
    syncFavButtons();
    if (typeof refreshNavBadges === 'function') refreshNavBadges();
}

function syncFavButtons() {
    document.querySelectorAll('.btn-fav').forEach(btn => {
        const frame = btn.closest('.item-frame');
        if (!frame) return;
        const title = (frame.querySelector('.item-title')?.textContent || '').trim();
        if (favorites[title]) {
            btn.classList.add('active');
            btn.setAttribute('aria-label', `Remove ${title} from favorites`);
            btn.innerHTML = '<i class="fas fa-heart"></i>';
        } else {
            btn.classList.remove('active');
            btn.setAttribute('aria-label', `Add ${title} to favorites`);
            btn.innerHTML = '<i class="far fa-heart"></i>';
        }
    });
}

document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-fav');
    if (!btn) return;
    e.stopPropagation();
    const frame = btn.closest('.item-frame');
    if (!frame) return;
    const title = (frame.querySelector('.item-title')?.textContent || '').trim();
    const priceText = frame.querySelector('.item-price')?.textContent || '';
    const parsed = parseFloat(priceText.replace(/[^\d.]/g, ''));
    const priceVal = isNaN(parsed) ? 0 : parsed;
    const imgEl = frame.querySelector('.item-image');
    const imgSrc = imgEl ? imgEl.src : '';
    if (!title) return;
    toggleFavorite(title, priceVal, imgSrc);
});

// ================================
// FAVORITES PAGE
// ================================
function renderFavoritesPage() {
    const list = document.getElementById('favorites-list');
    const clearBtn = document.getElementById('clear-fav-btn');
    const emptyCount = document.getElementById('fav-item-count');
    if (!list) return;

    const entries = Object.entries(favorites);

    if (clearBtn) clearBtn.style.display = entries.length === 0 ? 'none' : 'inline-flex';
    if (emptyCount) emptyCount.textContent = entries.length > 0
        ? `${entries.length} item${entries.length !== 1 ? 's' : ''} saved`
        : '';

    if (entries.length === 0) {
        list.innerHTML = `
            <div style="padding: 48px 0; text-align: center;">
                <i class="fas fa-heart" style="font-size: 52px; color: var(--tan-light); display: block; margin-bottom: 16px;"></i>
                <p style="color: var(--text-muted); font-size: 14px; font-weight: 600;">No favorites yet.</p>
                <p style="color: var(--text-muted); font-size: 13px; margin-top: 6px;">Tap the ♥ on any item to save it here.</p>
            </div>`;
        return;
    }

    list.innerHTML = entries.map(([title, data]) => `
        <div class="fav-card">
            <div class="fav-card-img-wrap">
                ${data.img ? `<img src="${data.img}" alt="${title}" class="fav-card-img">` : `<div class="fav-card-img-placeholder"><i class="fas fa-mug-hot"></i></div>`}
            </div>
            <div class="fav-card-body">
                <div class="fav-card-title">${title}</div>
                <div class="fav-card-price">₱${Number(data.price).toFixed(2)}</div>
            </div>
            <button class="fav-card-remove" onclick="removeFavorite('${title.replace(/'/g, "\\'")}')">
                <i class="fas fa-heart-broken"></i>
            </button>
        </div>
    `).join('');
}

function removeFavorite(title) {
    delete favorites[title];
    saveFavorites();
    updateFavIndicator();
    syncFavButtons();
    renderFavoritesPage();
    if (typeof refreshNavBadges === 'function') refreshNavBadges();
    showProfileToast('💔 Removed from favorites');
}

function clearFavorites() {
    if (!confirm('Clear all favorites? This cannot be undone.')) return;
    favorites = {};
    saveFavorites();
    updateFavIndicator();
    syncFavButtons();
    renderFavoritesPage();
    if (typeof refreshNavBadges === 'function') refreshNavBadges();
    showProfileToast('Favorites cleared.');
}

loadFavorites();
updateFavIndicator();

// ================================
// FEEDBACK
// ================================
const FEEDBACK_KEY = 'feedbacks';
let selectedRating = 0;

function getFeedbacks() {
    try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]'); } catch { return []; }
}
function saveFeedbacks(arr) { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(arr)); }

function initFeedbackPage() {
    selectedRating = 0;
    document.querySelectorAll('.star-btn').forEach(b => b.classList.remove('active'));
    const commentEl = document.getElementById('feedback-comment');
    if (commentEl) commentEl.value = '';
    const msgEl = document.getElementById('feedback-msg');
    if (msgEl) msgEl.textContent = '';

    document.querySelectorAll('.star-btn').forEach(btn => {
        btn.onclick = function() {
            selectedRating = parseInt(this.dataset.val);
            document.querySelectorAll('.star-btn').forEach((b, i) => {
                b.classList.toggle('active', i < selectedRating);
            });
        };
    });

    renderFeedbackList();
}

function submitFeedback() {
    const comment = document.getElementById('feedback-comment')?.value.trim();
    const msgEl = document.getElementById('feedback-msg');
    if (!selectedRating) { if (msgEl) { msgEl.textContent = 'Please select a star rating.'; msgEl.style.color = 'var(--danger)'; } return; }
    if (!comment) { if (msgEl) { msgEl.textContent = 'Please write a comment.'; msgEl.style.color = 'var(--danger)'; } return; }

    const username = getCurrentUsername();
    const feedbacks = getFeedbacks();
    feedbacks.unshift({
        username: '@' + username,
        rating: selectedRating,
        comment,
        date: new Date().toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' })
    });
    saveFeedbacks(feedbacks);

    selectedRating = 0;
    document.querySelectorAll('.star-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('feedback-comment').value = '';
    if (msgEl) { msgEl.textContent = '✓ Thank you for your feedback!'; msgEl.style.color = 'var(--success)'; }
    setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 3000);

    renderFeedbackList();
    renderSidebarFeedback();
}

function renderFeedbackList() {
    const list = document.getElementById('feedback-list');
    if (!list) return;
    const feedbacks = getFeedbacks();
    if (feedbacks.length === 0) {
        list.innerHTML = `<p style="text-align:center;color:var(--text-muted);font-size:13px;padding:20px 0;">No feedback yet. Be the first!</p>`;
        return;
    }
    list.innerHTML = feedbacks.map(f => `
        <div class="feedback-card">
            <div class="feedback-card-top">
                <span class="feedback-username">${f.username}</span>
                <span class="feedback-stars">${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</span>
            </div>
            <div class="feedback-comment">"${f.comment}"</div>
            <div class="feedback-date">${f.date}</div>
        </div>
    `).join('');
}

function renderSidebarFeedback() {
    const container = document.getElementById('sidebar-feedback-list');
    if (!container) return;
    const feedbacks = getFeedbacks().slice(0, 3);
    if (feedbacks.length === 0) {
        container.innerHTML = `<p style="font-size:12px;color:var(--text-muted);padding:8px 24px;">No feedback yet.</p>`;
        return;
    }
    container.innerHTML = feedbacks.map(f => `
        <div class="sidebar-feedback-item">
            <div class="sidebar-feedback-top">
                <span class="sidebar-feedback-user">${f.username}</span>
                <span class="sidebar-feedback-stars">${'★'.repeat(f.rating)}</span>
            </div>
            <div class="sidebar-feedback-text">"${f.comment}"</div>
        </div>
    `).join('');
}
