// script.js
const API_URL = 'http://localhost:5000/api';

// State
let currentUser = null;
let authToken = localStorage.getItem('authToken') || null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];
let authMode = 'login';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartUI();
    checkAuth();
    
    // Auth form handler
    document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);
});

// ============ AUTH FUNCTIONS ============

async function checkAuth() {
    if (authToken) {
        try {
            const orders = await fetchOrders();
            if (orders) {
                const user = JSON.parse(localStorage.getItem('user'));
                setCurrentUser(user);
            }
        } catch (error) {
            logout();
        }
    }
}

function setCurrentUser(user) {
    currentUser = user;
    document.getElementById('login-btn').classList.add('hidden');
    document.getElementById('logout-btn').classList.remove('hidden');
    document.getElementById('orders-nav').classList.remove('hidden');
    document.getElementById('user-name').textContent = user.name;
}

function showAuthModal() {
    document.getElementById('auth-modal').classList.add('active');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('active');
}

function toggleAuthMode() {
    authMode = authMode === 'login' ? 'register' : 'login';
    
    const nameInput = document.getElementById('auth-name');
    const title = document.getElementById('auth-title');
    const switchText = document.getElementById('auth-switch-text');
    const submitBtn = document.querySelector('#auth-form button');
    
    if (authMode === 'register') {
        nameInput.classList.remove('hidden');
        nameInput.required = true;
        title.textContent = 'Register';
        switchText.textContent = 'Already have an account?';
        submitBtn.textContent = 'Register';
    } else {
        nameInput.classList.add('hidden');
        nameInput.required = false;
        title.textContent = 'Login';
        switchText.textContent = "Don't have an account?";
        submitBtn.textContent = 'Login';
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const name = document.getElementById('auth-name').value;
    
    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
    const body = authMode === 'login' 
        ? { email, password }
        : { name, email, password };
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            setCurrentUser(data.user);
            closeAuthModal();
            alert(`${authMode === 'login' ? 'Login' : 'Registration'} successful!`);
            document.getElementById('auth-form').reset();
        } else {
            alert(data.error || 'Authentication failed');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

function logout() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    document.getElementById('login-btn').classList.remove('hidden');
    document.getElementById('logout-btn').classList.add('hidden');
    document.getElementById('orders-nav').classList.add('hidden');
    
    showPage('products');
}

// ============ PRODUCTS FUNCTIONS ============

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        products = await response.json();
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = products.map(product => `
        <div class="product-card" onclick="showProductDetails(${product.id})">
            <img src="${product.image_url}" alt="${product.name}">
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">$${product.price.toFixed(2)}</span>
                    <button class="btn-primary" onclick="event.stopPropagation(); addToCart(${product.id})">
                        🛒 Add
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function showProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const detailsDiv = document.getElementById('product-details');
    detailsDiv.innerHTML = `
        <div class="product-details">
            <img src="${product.image_url}" alt="${product.name}">
            <div class="product-details-info">
                <div class="product-category">${product.category}</div>
                <h1>${product.name}</h1>
                <div class="product-price" style="margin: 1rem 0;">$${product.price.toFixed(2)}</div>
                <p style="margin: 1rem 0;">${product.description}</p>
                <div class="product-stock">
                    <span>Stock: </span>
                    <span class="${product.stock > 5 ? 'stock-available' : 'stock-low'}">
                        ${product.stock} available
                    </span>
                </div>
                <button class="btn-primary" onclick="addToCart(${product.id})" 
                        style="width: 100%; margin-top: 2rem; padding: 1rem;">
                    🛒 Add to Cart
                </button>
            </div>
        </div>
    `;
    
    showPage('product-details');
}

// ============ CART FUNCTIONS ============

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image_url,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    alert('Added to cart!');
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = Math.max(1, item.quantity + change);
        saveCart();
        renderCart();
        updateCartUI();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
}

function renderCart() {
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalDiv = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <button class="btn-primary" onclick="showPage('products')" style="margin-top: 1rem;">
                    Continue Shopping
                </button>
            </div>
        `;
        cartTotalDiv.innerHTML = '';
        return;
    }
    
    cartItemsDiv.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <div class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</div>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">🗑️ Remove</button>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartTotalDiv.innerHTML = `
        <div class="total-amount">Total: $${total.toFixed(2)}</div>
        <button class="checkout-btn" onclick="checkout()">Place Order</button>
    `;
}

async function checkout() {
    if (!currentUser) {
        alert('Please login to place an order');
        showAuthModal();
        return;
    }
    
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                items: cart,
                total: total
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Order placed successfully!');
            cart = [];
            saveCart();
            updateCartUI();
            showPage('orders');
            loadOrders();
        } else {
            alert(data.error || 'Failed to place order');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

// ============ ORDERS FUNCTIONS ============

async function fetchOrders() {
    const response = await fetch(`${API_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch orders');
    return await response.json();
}

async function loadOrders() {
    if (!currentUser) {
        document.getElementById('orders-list').innerHTML = `
            <div class="empty-orders">
                <h3>Please login to view orders</h3>
            </div>
        `;
        return;
    }
    
    try {
        const orders = await fetchOrders();
        renderOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function renderOrders(orders) {
    const ordersDiv = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        ordersDiv.innerHTML = `
            <div class="empty-orders">
                <div class="empty-cart-icon">📦</div>
                <h3>No orders yet</h3>
            </div>
        `;
        return;
    }
    
    ordersDiv.innerHTML = orders.map(order => {
        const orderItems = order.items.map(item => {
            const product = products.find(p => p.id == item.product_id);
            return `
                <div class="order-item">
                    <img src="${product?.image_url || ''}" alt="${product?.name || 'Product'}">
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">${product?.name || 'Product'}</div>
                        <div style="color: #6b7280; font-size: 0.875rem;">Quantity: ${item.quantity}</div>
                    </div>
                    <div style="font-weight: 600;">$${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h3>Order #${order.id}</h3>
                        <p style="color: #6b7280; margin-top: 0.25rem;">${new Date(order.date).toLocaleDateString()}</p>
                    </div>
                    <span class="order-status">${order.status}</span>
                </div>
                ${orderItems}
                <div class="order-total">
                    <span>Total:</span>
                    <span style="color: #10b981;">$${parseFloat(order.total).toFixed(2)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ============ NAVIGATION ============

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    document.getElementById(`${pageName}-page`).classList.add('active');
    
    if (pageName === 'cart') {
        renderCart();
    } else if (pageName === 'orders') {
        loadOrders();
    }
}