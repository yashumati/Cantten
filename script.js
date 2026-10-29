let cart = [];

// Toast notification helper function
function showToast(message) {
    const toast = document.getElementById("toast");
    if (toast) {
        toast.innerText = message;
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 2500);
    }
}

// Add to Cart Function
function addToCart(name, price) {
    cart.push({ name, price });
    showToast(name + " added to cart!");
    updateCartUI();
}

// Update Cart UI (With Remove Button)
function updateCartUI() {
    const cartCountElement = document.getElementById("cart-count");
    if (cartCountElement) {
        cartCountElement.innerText = cart.length;
    }

    const cartItemsContainer = document.getElementById("cart-items");
    const cartTotalElement = document.getElementById("cart-total");
    
    let total = 0;
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = "";
        cart.forEach((item, index) => {
            total += item.price;
            cartItemsContainer.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                    <span>${item.name} (₹${item.price})</span>
                    <button onclick="removeFromCart(${index})" style="background: #dc3545; color: white; border: none; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">❌ Remove</button>
                </div>`;
        });
    }
    
    if (cartTotalElement) {
        cartTotalElement.innerText = "₹" + total;
    }
}

// Remove Specific Item from Cart
function removeFromCart(index) {
    const removedItem = cart[index].name;
    cart.splice(index, 1);
    updateCartUI();
    showToast(removedItem + " cart madhun remove zala!");
}

// Modal Handlers
function closeCart() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) cartModal.style.display = 'none';
}

function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        console.error("Login modal element sapadla nahi!");
    }
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle Login Authentication
function handleAuth(event) {
    event.preventDefault();

    const emailInput = document.getElementById('login-email'); 
    const email = emailInput ? emailInput.value : "student@college.com";
    const name = email.split('@')[0].trim();

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userName", name);

    showToast("Login successful!");
    closeLoginModal();

    setTimeout(() => {
        location.reload(); 
    }, 1000);
}

// Open Payment Modal
function openPaymentModal() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    
    if (!isLoggedIn || isLoggedIn !== "true") {
        showToast("Order karnyasathi aadhi login karayla lagel!");
        closeCart();
        openLoginModal();
        return;
    }

    if (cart.length === 0) {
        showToast("Cart empty ahe!");
        return;
    }
    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) paymentModal.style.display = 'flex';
}

function closePaymentModal() {
    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) paymentModal.style.display = 'none';
}

// Confirm and Place Order
function confirmAndPlaceOrder() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const studentName = localStorage.getItem("userName");
    
    if (!isLoggedIn || isLoggedIn !== "true" || !studentName) {
        showToast("Aadhi login karayla lagel!");
        closePaymentModal();
        openLoginModal();
        return;
    }

    const selectedOption = document.querySelector('input[name="paymentOption"]:checked');
    const paymentMethod = selectedOption ? selectedOption.value : "Cash on Counter";

    const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
    const itemNames = cart.map(item => item.name).join(', ');

    const orderData = {
        customerName: studentName,
        items: itemNames,
        total: totalAmount,
        paymentMethod: paymentMethod
    };

    fetch('http://localhost:8081/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    })
    .then(async response => {
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Server error');
        }
        return response.json();
    })
    .then(data => {
        showToast(`Order successfully placed via ${paymentMethod}! 🎉`);
        cart = [];
        updateCartUI();
        closeCart();
        closePaymentModal();
        
        setTimeout(() => {
            location.reload();
        }, 1500);
    })
    .catch(error => {
        showToast("Order fail zali! Backend check kara.");
        console.error("Full Order Error:", error.message);
    });
}

// Check Food Item Availability & Update UI Buttons
async function updateItemAvailability() {
    try {
        const response = await fetch('http://localhost:8081/api/food');
        if (!response.ok) return;
        const dbItems = await response.json();

        const cards = document.querySelectorAll('.menu-card');
        
        cards.forEach(card => {
            const titleElement = card.querySelector('h3');
            if (!titleElement) return;
            const itemName = titleElement.innerText.trim().toLowerCase();

            const matchedItem = dbItems.find(i => 
                itemName.includes(i.name.toLowerCase()) || 
                i.name.toLowerCase().includes(itemName)
            );

            if (matchedItem && matchedItem.available === false) {
                const btn = card.querySelector('.btn-add');
                if (btn) {
                    btn.outerHTML = `<span style="color: #dc3545; font-weight: bold; background: #f8d7da; padding: 6px 12px; border-radius: 4px; display: inline-block; margin-top: 8px;">Not Available</span>`;
                }
            }
        });
    } catch (error) {
        console.error("Error updating availability:", error);
    }
}

// Web Audio API for Order Ready Notification
let audioCtx = null;

document.addEventListener('click', () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}, { once: true });

function playReadyBeep() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.0);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 1.0);
    } catch (e) {
        console.log("Audio play error:", e);
    }
}

// Student order status tracking
setInterval(checkMyOrderStatus, 5000);

async function checkMyOrderStatus() {
    const userName = localStorage.getItem("userName");
    if (!userName) return; 

    try {
        const response = await fetch('http://localhost:8081/api/orders');
        if (!response.ok) return;
        const orders = await response.json();

        orders.forEach(order => {
            if (order.customerName === userName && order.status === "READY") {
                const notifiedKey = `notified_${order.id}`;
                if (!localStorage.getItem(notifiedKey)) {
                    playReadyBeep();
                    setTimeout(() => {
                        alert(`🎉 Hey ${userName}! Tumchi Order #${order.id} canteen madhe READY ahe! Pickup karun ghya.`);
                    }, 300);
                    localStorage.setItem(notifiedKey, "true");
                }
            }
        });
    } catch (err) {
        console.error("Error checking user order status:", err);
    }
}

// Page Load Event Listener (Cart Modal & Availability Check)
document.addEventListener('DOMContentLoaded', () => {
    const cartBtn = document.getElementById('cart-btn');
    const cartModal = document.getElementById('cart-modal');
    
    if (cartBtn && cartModal) {
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            cartModal.style.display = 'flex';
            updateCartUI();
        });
    }

    // Call availability check on page load!
    updateItemAvailability();
});
// Dropdown click event listeners

document.addEventListener('DOMContentLoaded', () => {
    const dropdownLinks = document.querySelectorAll('.dropdown-content a, .dropdown-menu a, .dropdown-item');
    
    dropdownLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Count kadhun takne (udaharanarth "Breakfast (6)" madhun fkt "Breakfast" ghehne)
            const rawText = link.innerText;
            const categoryName = rawText.replace(/\s*\(\d+\)/g, '').trim();
            filterCategory(categoryName);
        });
    });
});

// Perfect Category Filtering Function
// // function filterCategory(categoryName) {
//     const cleanCategory = categoryName.toLowerCase().replace(/[^a-z]/g, ''); // "Non-Veg" la "nonveg" madhe convert karel
    
//     // Sagle menu sections select karne
//     const sections = document.querySelectorAll('.app-view');
    
//     sections.forEach(section => {
//         // Cart ani Orders view la touch karu naye
//         if (section.id === 'cart-view' || section.id === 'orders-view') return;

//         if (cleanCategory === 'all') {
//             section.style.display = 'block'; // Sagle disu de
//         } else {
//             // Jar sectioncha ID select kelelya category barobar match hot asel tarach dakhavne
//             if (section.id.toLowerCase().includes(cleanCategory) || cleanCategory.includes(section.id.toLowerCase())) {
//                 section.style.display = 'block';
//             } else {
//                 section.style.display = 'none'; // Baakichya categories lapavne
//             }
//         }
//     });

//     // Items available ahet ka te punha check karne
//     if (typeof updateItemAvailability === 'function') {
//         updateItemAvailability();
//     }
// // }
function filterCategory(categoryName) {
    const rawCategory = categoryName.trim().toLowerCase();
    
    // Main sections (breakfast, beverages, veg, nonveg)
    const sections = document.querySelectorAll('#breakfast, #beverages, #veg, #nonveg');
    const allCards = document.querySelectorAll('.menu-card');

    // Cart and Orders view hamesha hidden thevne menu switch hotana
    const cartView = document.getElementById('cart-view');
    const ordersView = document.getElementById('orders-view');
    if (cartView) cartView.style.display = 'none';
    if (ordersView) ordersView.style.display = 'none';

    if (rawCategory.includes('all')) {
        // Jar 'All Items' select kela tar sagle 4 sections ani sagle cards dakhavne
        sections.forEach(sec => sec.style.display = 'block');
        allCards.forEach(card => card.style.display = 'block');
    } else {
        // Specific category filter karne
        const cleanKey = rawCategory.replace(/[^a-z]/g, ''); // "non-veg" -> "nonveg"
        
        sections.forEach(sec => {
            if (sec.id.toLowerCase().includes(cleanKey) || cleanKey.includes(sec.id.toLowerCase())) {
                sec.style.display = 'block';
            } else {
                sec.style.display = 'none';
            }
        });

        allCards.forEach(card => card.style.display = 'block');
    }

    // Availability check update karne
    if (typeof updateItemAvailability === 'function') {
        updateItemAvailability();
    }
}

// Jar HTML madhe switchView call kel asel tar hyasathi helper:
function switchView(viewName) {
    if (viewName === 'all') {
        filterCategory('All');
    } else {
        const sections = document.querySelectorAll('.app-view');
        sections.forEach(sec => sec.style.display = 'none');
        const target = document.getElementById(viewName);
        if (target) target.style.display = 'block';
    }
}