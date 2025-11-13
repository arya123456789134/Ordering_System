document.addEventListener('DOMContentLoaded', () => {

    let foods = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    loadFoods();
    
    const menuList = document.getElementById('menuList');
    let cartList, totalPriceEl, checkoutBtn, pastOrdersDiv;

    const body = document.body;

    const userPanelButtons = document.createElement('div');
    userPanelButtons.className = 'user-panel-buttons';
    userPanelButtons.innerHTML = `
        <button id="viewCartBtn" class="btn-with-badge">
            View Cart
            <span id="cartBadge" class="badge">0</span>
        </button>
        <button id="viewOrdersBtn" class="btn-with-badge">
            View Orders
            <span id="ordersBadge" class="badge">0</span>
        </button>
        <button id="speechToggleBtn" title="Toggle Speech Announcements">
            🔊
        </button>
    `;
    body.appendChild(userPanelButtons);

    const cartPanel = document.createElement('div');
    cartPanel.id = 'cartPanel';
    cartPanel.className = 'user-panel';
    cartPanel.innerHTML = `
        <h3>Your Cart</h3>
        <div id="cartList"></div>
        <p>Total: ₱<span id="totalPrice">0.00</span></p>
        <button id="checkoutBtn">Checkout</button>
    `;
    body.appendChild(cartPanel);

    const ordersPanel = document.createElement('div');
    ordersPanel.id = 'ordersPanel';
    ordersPanel.className = 'user-panel';
    ordersPanel.innerHTML = `
        <h3>Your Orders</h3>
        <div id="pastOrdersDiv"></div>
    `;
    body.appendChild(ordersPanel);

    cartList = document.getElementById('cartList');
    totalPriceEl = document.getElementById('totalPrice');
    checkoutBtn = document.getElementById('checkoutBtn');
    pastOrdersDiv = document.getElementById('pastOrdersDiv');
    const cartBadge = document.getElementById('cartBadge');
    const ordersBadge = document.getElementById('ordersBadge');

    cartPanel.style.display = 'none';
    ordersPanel.style.display = 'none';

    document.getElementById('viewCartBtn').addEventListener('click', () => {
        // Announce cart view with speech
        if (typeof speechService !== 'undefined' && speechService.isEnabled) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            const cartStatus = totalItems > 0 ? `with ${totalItems} item${totalItems !== 1 ? 's' : ''}` : 'which is empty';
            const message = `View cart button clicked. Viewing cart ${cartStatus}`;
            speechService.speak(message, { rate: 1.0 });
        }

        ordersPanel.classList.remove('active');
        ordersPanel.style.display = 'none';
        togglePanel('cartPanel');
        renderCart(); 
    });

    document.getElementById('viewOrdersBtn').addEventListener('click', async () => {
        // Announce orders view with speech
        if (typeof speechService !== 'undefined' && speechService.isEnabled) {
            try {
                const response = await fetch('backend/orders.php');
                const orders = await response.json();
                const orderCount = orders.length;
                const readyOrders = orders.filter(order => order.status === 'ready').length;
                const completedOrders = orders.filter(order => order.status === 'completed').length;
                
                let orderStatus = orderCount > 0 ? `You have ${orderCount} order${orderCount !== 1 ? 's' : ''}` : 'No orders found';
                
                // Add receipt availability information
                if (readyOrders > 0 || completedOrders > 0) {
                    const receiptCount = readyOrders + completedOrders;
                    orderStatus += `. ${receiptCount} receipt${receiptCount !== 1 ? 's' : ''} available for viewing`;
                }
                
                const message = `View orders button clicked. ${orderStatus}`;
                speechService.speak(message, { rate: 1.0 });
            } catch (error) {
                speechService.speak('View orders button clicked. Viewing your orders', { rate: 1.0 });
            }
        }

        cartPanel.classList.remove('active');
        cartPanel.style.display = 'none';
        togglePanel('ordersPanel');
        renderOrders(); 
    });
    
    checkoutBtn.addEventListener('click', checkout);
    
    const speechToggleBtn = document.getElementById('speechToggleBtn');
    
    if (speechToggleBtn && typeof speechService !== 'undefined') {
        updateSpeechButton();
        
        speechToggleBtn.addEventListener('click', () => {
            const wasEnabled = speechService.isEnabled;
            speechService.toggle();
            updateSpeechButton();
            
            if (speechService.isEnabled && !wasEnabled) {
                if (speechService.isMobile) {

                    setTimeout(() => {
                        speechService.testSpeech();
                    }, 200);
                } else {
                    speechService.speak('Speech enabled', { rate: 1.0 });
                }
            }
        });
    }
    
    function updateSpeechButton() {
        if (speechToggleBtn && typeof speechService !== 'undefined') {
            speechToggleBtn.innerHTML = speechService.isEnabled ? '🔊' : '🔇';
            speechToggleBtn.style.opacity = speechService.isEnabled ? '1' : '0.5';
            
            if (speechService.isMobile) {
                speechToggleBtn.title = speechService.isEnabled 
                    ? 'Disable Speech (Mobile: Tap to turn off)' 
                    : 'Enable Speech (Mobile: Tap button then click a menu item)';
            } else {
                speechToggleBtn.title = speechService.isEnabled ? 'Disable Speech' : 'Enable Speech';
            }
        }
    }

    async function loadFoods() {
        try {
            const response = await fetch('backend/foods.php');
            foods = await response.json();
            displayMenu();
        } catch (error) {
            console.error('Error loading foods:', error);
        }
    }

    function updateCartBadge() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'inline' : 'none';
    }

    async function updateOrdersBadge() {
        try {
            const response = await fetch('backend/orders.php');
            const orders = await response.json();
            const readyOrders = orders.filter(order => order.status === 'ready').length;
            const totalOrders = orders.length;
            
            // Show ready orders count if any, otherwise show total orders
            if (readyOrders > 0) {
                ordersBadge.textContent = readyOrders;
                ordersBadge.style.display = 'inline';
                ordersBadge.style.background = '#4CAF50'; // Green for ready orders
                ordersBadge.title = `${readyOrders} order${readyOrders !== 1 ? 's' : ''} ready with receipt${readyOrders !== 1 ? 's' : ''} available`;
            } else {
                ordersBadge.textContent = totalOrders;
                ordersBadge.style.display = totalOrders > 0 ? 'inline' : 'none';
                ordersBadge.style.background = '#2196F3'; // Blue for regular orders
                ordersBadge.title = `${totalOrders} order${totalOrders !== 1 ? 's' : ''}`;
            }
        } catch (error) {
            console.error('Error updating orders badge:', error);
            ordersBadge.style.display = 'none';
        }
    }

    renderCart();
    renderOrders();
    updateCartBadge();
    updateOrdersBadge();

    function displayMenu() {
        menuList.innerHTML = '';
        const categoryMap = {};
        foods.forEach(f => {
            const key = f.category.trim().toLowerCase();
            if (!categoryMap[key]) categoryMap[key] = f.category.trim();
        });

        const btnContainer = document.createElement('div');
        btnContainer.className = "category-buttons";
        btnContainer.innerHTML = `<button onclick="filterCategory('all')">All</button>`;
        Object.values(categoryMap).forEach(cat => {
            btnContainer.innerHTML += ` <button onclick="filterCategory('${cat}')">${cat}</button>`;
        });
        menuList.appendChild(btnContainer);

        renderFoods('all');
    }

    window.filterCategory = function(category) {
        renderFoods(category);
    };

    function renderFoods(selectedCategory) {
        menuList.querySelectorAll('.food-container').forEach(el => el.remove());
        const catDivMap = {};

        foods.forEach(food => {
            const catKey = food.category.trim().toLowerCase();
            if (selectedCategory !== 'all' && food.category !== selectedCategory) return;

            if (!catDivMap[catKey]) {
                const catDiv = document.createElement('div');
                catDiv.className = 'food-container';
                catDiv.dataset.category = food.category;
                catDiv.innerHTML = `<h3>${food.category}</h3>`;
                menuList.appendChild(catDiv);
                catDivMap[catKey] = catDiv;
            }

            const foodDiv = document.createElement('div');
            foodDiv.className = 'food-item';
            
            let priceDisplay = `₱${parseFloat(food.price).toFixed(2)}`;
            let hasSizes = false;
            let sizes = null;
            
            if (food.sizes) {
                try {
                    sizes = JSON.parse(food.sizes);
                    hasSizes = true;
                    priceDisplay = `Small: ₱${parseFloat(sizes.small).toFixed(2)} | Large: ₱${parseFloat(sizes.large).toFixed(2)}`;
                } catch (e) {

                }
            }
            
            let hasToppings = false;
            let toppings = null;
            if (food.toppings) {
                try {
                    toppings = JSON.parse(food.toppings);
                    hasToppings = toppings.length > 0;
                } catch (e) {

                }
            }
            
            if (hasSizes) {

                let toppingsSection = '';
                if (hasToppings) {
                    const toppingsList = toppings.map((t, idx) => 
                        `<label style="display: flex; align-items: center; gap: 5px; font-size: 13px; margin: 5px 0;">
                            <input type="checkbox" class="topping-checkbox" data-topping-name="${t.name}" data-topping-price="${t.price}" style="width: auto;">
                            <span>${t.name} (+₱${parseFloat(t.price).toFixed(2)})</span>
                        </label>`
                    ).join('');
                    toppingsSection = `
                        <div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 13px;">Toppings:</label>
                            ${toppingsList}
                        </div>
                    `;
                }
                
                foodDiv.innerHTML = `
                    <img src="${food.image}" alt="${food.name}">
                    <div><strong>${food.name}</strong></div>
                    <div style="margin: 10px 0;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Select Size:</label>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button onclick="addToCartWithSizeAndToppings('${food.name}', ${sizes.small}, 'small', ${food.id}, this)" style="flex: 1; padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                                Small<br>₱${parseFloat(sizes.small).toFixed(2)}
                            </button>
                            <button onclick="addToCartWithSizeAndToppings('${food.name}', ${sizes.large}, 'large', ${food.id}, this)" style="flex: 1; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                                Large<br>₱${parseFloat(sizes.large).toFixed(2)}
                            </button>
                        </div>
                    </div>
                    ${toppingsSection}
                `;
            } else {
                let toppingsSection = '';
                if (hasToppings) {
                    const toppingsList = toppings.map((t, idx) => 
                        `<label style="display: flex; align-items: center; gap: 5px; font-size: 13px; margin: 5px 0;">
                            <input type="checkbox" class="topping-checkbox" data-topping-name="${t.name}" data-topping-price="${t.price}" style="width: auto;">
                            <span>${t.name} (+₱${parseFloat(t.price).toFixed(2)})</span>
                        </label>`
                    ).join('');
                    toppingsSection = `
                        <div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 13px;">Toppings:</label>
                            ${toppingsList}
                        </div>
                    `;
                }
                
                foodDiv.innerHTML = `
                    <img src="${food.image}" alt="${food.name}">
                    <div><strong>${food.name}</strong></div>
                    <div>${priceDisplay}</div>
                    ${toppingsSection}
                    <button onclick="addToCartWithToppings('${food.name}',${food.price}, ${food.id}, this)">Add</button>
                `;
            }
            
            catDivMap[catKey].appendChild(foodDiv);
        });
    }

    window.addToCart = function(name, price, foodId) {

        if (!foodId) {
            const food = foods.find(f => f.name === name);
            foodId = food ? food.id : null;
        }
        const existing = cart.find(item => item.name === name && !item.size);
        if (existing) existing.quantity += 1;
        else cart.push({ name, price, quantity: 1, food_id: foodId });
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCartBadge();
        
        if (typeof speechService !== 'undefined') {

            if (speechService.isMobile) {
                speechService.userInteractionRequired = false;
            }
            speechService.announceItemAdded(name);
        }
    }
    
    window.addToCartWithSize = function(name, price, size, foodId) {
        const sizeLabel = size.charAt(0).toUpperCase() + size.slice(1);
        const displayName = `${name} (${sizeLabel})`;
        const existing = cart.find(item => item.name === name && item.size === size && JSON.stringify(item.selectedToppings || []) === JSON.stringify([]));
        if (existing) existing.quantity += 1;
        else cart.push({ name, price, quantity: 1, size: size, food_id: foodId, selectedToppings: [] });
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCartBadge();
        
        if (typeof speechService !== 'undefined') {
            if (speechService.isMobile) {
                speechService.userInteractionRequired = false;
            }
            speechService.announceItemAdded(displayName);
        }
    }
    
    window.addToCartWithToppings = function(name, price, foodId, buttonElement) {

        const foodDiv = buttonElement.closest('.food-item');
        const selectedToppings = [];
        if (foodDiv) {
            const checkboxes = foodDiv.querySelectorAll('.topping-checkbox:checked');
            checkboxes.forEach(cb => {
                selectedToppings.push({
                    name: cb.dataset.toppingName,
                    price: parseFloat(cb.dataset.toppingPrice)
                });
            });
        }
        
        const toppingsTotal = selectedToppings.reduce((sum, t) => sum + t.price, 0);
        const totalPrice = price + toppingsTotal;
        
        const toppingsKey = JSON.stringify(selectedToppings.map(t => t.name).sort());
        const existing = cart.find(item => 
            item.name === name && 
            !item.size && 
            JSON.stringify((item.selectedToppings || []).map(t => t.name).sort()) === toppingsKey
        );
        
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ 
                name, 
                price: totalPrice, 
                basePrice: price,
                quantity: 1, 
                food_id: foodId,
                selectedToppings: selectedToppings
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCartBadge();
        
        if (foodDiv) {
            foodDiv.querySelectorAll('.topping-checkbox').forEach(cb => cb.checked = false);
        }
        
        if (typeof speechService !== 'undefined') {
            if (speechService.isMobile) {
                speechService.userInteractionRequired = false;
            }
            const toppingsText = selectedToppings.length > 0 ? ` with ${selectedToppings.map(t => t.name).join(', ')}` : '';
            speechService.announceItemAdded(name + toppingsText);
        }
    }
    
    window.addToCartWithSizeAndToppings = function(name, price, size, foodId, buttonElement) {

        const foodDiv = buttonElement.closest('.food-item');
        const selectedToppings = [];
        if (foodDiv) {
            const checkboxes = foodDiv.querySelectorAll('.topping-checkbox:checked');
            checkboxes.forEach(cb => {
                selectedToppings.push({
                    name: cb.dataset.toppingName,
                    price: parseFloat(cb.dataset.toppingPrice)
                });
            });
        }
        
        const toppingsTotal = selectedToppings.reduce((sum, t) => sum + t.price, 0);
        const totalPrice = price + toppingsTotal;
        
        const sizeLabel = size.charAt(0).toUpperCase() + size.slice(1);
        const toppingsKey = JSON.stringify(selectedToppings.map(t => t.name).sort());
        const existing = cart.find(item => 
            item.name === name && 
            item.size === size &&
            JSON.stringify((item.selectedToppings || []).map(t => t.name).sort()) === toppingsKey
        );
        
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ 
                name, 
                price: totalPrice,
                basePrice: price,
                quantity: 1, 
                size: size,
                food_id: foodId,
                selectedToppings: selectedToppings
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCartBadge();
        
        if (foodDiv) {
            foodDiv.querySelectorAll('.topping-checkbox').forEach(cb => cb.checked = false);
        }
        
        if (typeof speechService !== 'undefined') {
            if (speechService.isMobile) {
                speechService.userInteractionRequired = false;
            }
            const toppingsText = selectedToppings.length > 0 ? ` with ${selectedToppings.map(t => t.name).join(', ')}` : '';
            speechService.announceItemAdded(`${name} (${sizeLabel})${toppingsText}`);
        }
    }

    window.updateCart = function(index, newQty) {
        newQty = parseInt(newQty);
        if (newQty <= 0) {
            removeFromCart(index);
            return;
        }
        cart[index].quantity = newQty;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCartBadge();
    }

    window.removeFromCart = function(index) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCartBadge();
    }

    window.increaseQuantity = function(index) {
        cart[index].quantity += 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCartBadge();
    }

    window.decreaseQuantity = function(index) {
        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCart();
            updateCartBadge();
        } else {

            removeFromCart(index);
        }
    }

    async function checkout() {
        if (cart.length === 0) return alert("Cart empty!");
        
        const customerName = prompt("Enter your name (optional):", "");
        
        if (customerName === null) return;
        
        try {

            const orderItems = cart.map(item => {
                const food = foods.find(f => f.id === item.food_id || f.name === item.name);
                const foodId = food ? food.id : item.food_id;
                
                if (!foodId) {
                    throw new Error('Food ID not found for item: ' + (item.name || 'Unknown'));
                }
                
                return {
                    food_id: foodId,
                    quantity: item.quantity || 1,
                    price: item.price || 0,
                    size: item.size || null,
                    toppings: item.selectedToppings ? JSON.stringify(item.selectedToppings) : null
                };
            });
            
            const response = await fetch('backend/orders.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: orderItems,
                    customer_name: customerName.trim() || 'Anonymous'
                })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to place order');
            }
            
            if (result.success) {

                const orderDetails = {
                    trackingNumber: result.tracking_number,
                    customerName: customerName.trim() || 'Anonymous',
                    items: cart,
                    total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    date: new Date().toLocaleString()
                };
                
                if (typeof speechService !== 'undefined') {
                    speechService.announceOrderConfirmation(orderDetails);
                }
                
                alert(`Order placed successfully! Your tracking number is ${result.tracking_number}`);
                
                cart = [];
                localStorage.setItem('cart', JSON.stringify(cart));
                renderCart();
                renderOrders();
                updateCartBadge();
                updateOrdersBadge();
            } else {
                alert("Failed to place order: " + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error placing order:', error);
            alert("Failed to place order: " + error.message);
        }
    }

    function renderCart() {
        cartList.innerHTML = '';
        let total = 0;
        cart.forEach((item, index) => {
            total += item.price * item.quantity;
            const div = document.createElement('div');
            div.className = 'cart-item';
            
            const food = foods.find(f => f.id === item.food_id || f.name === item.name);
            let hasSizes = false;
            let sizes = null;
            
            if (food && food.sizes) {
                try {
                    sizes = JSON.parse(food.sizes);
                    hasSizes = true;
                } catch (e) {

                }
            }
            
            const displayName = item.size ? `${item.name} (${item.size.charAt(0).toUpperCase() + item.size.slice(1)})` : item.name;
            
            let sizeSelector = '';
            if (hasSizes && sizes) {

                if (!item.size) {
                    item.size = 'small';
                    const basePrice = sizes.small;
                    const toppingsTotal = (item.selectedToppings || []).reduce((sum, t) => sum + t.price, 0);
                    item.price = basePrice + toppingsTotal;
                    item.basePrice = basePrice;
                    localStorage.setItem('cart', JSON.stringify(cart));
                }
                const currentSize = item.size;
                sizeSelector = `
                    <div class="size-selector" style="margin: 8px 0; padding: 8px; background: #f5f5f5; border-radius: 5px;">
                        <label style="display: block; margin-bottom: 5px; font-size: 13px; font-weight: 600; color: #333;">Change Size:</label>
                        <select onchange="changeCartItemSize(${index}, this.value)" style="width: 100%; padding: 8px; border: 2px solid #2196F3; border-radius: 4px; font-size: 14px; background: white; cursor: pointer;">
                            <option value="small" ${currentSize === 'small' ? 'selected' : ''}>Small - ₱${parseFloat(sizes.small).toFixed(2)}</option>
                            <option value="large" ${currentSize === 'large' ? 'selected' : ''}>Large - ₱${parseFloat(sizes.large).toFixed(2)}</option>
                        </select>
                    </div>
                `;
            }
            
            let toppingsSelector = '';
            if (food && food.toppings) {
                try {
                    const availableToppings = JSON.parse(food.toppings);
                    if (availableToppings.length > 0) {
                        const currentToppings = (item.selectedToppings || []).map(t => t.name);
                        const toppingsList = availableToppings.map(t => {
                            const isChecked = currentToppings.includes(t.name);
                            return `
                                <label style="display: flex; align-items: center; gap: 5px; font-size: 12px; margin: 3px 0;">
                                    <input type="checkbox" class="cart-topping-checkbox" data-topping-name="${t.name}" data-topping-price="${t.price}" 
                                           onchange="updateCartItemToppings(${index})" ${isChecked ? 'checked' : ''} style="width: auto;">
                                    <span>${t.name} (+₱${parseFloat(t.price).toFixed(2)})</span>
                                </label>
                            `;
                        }).join('');
                        
                        toppingsSelector = `
                            <div class="toppings-selector" style="margin: 8px 0; padding: 8px; background: #fff3cd; border-radius: 5px; border: 1px solid #ffc107;">
                                <label style="display: block; margin-bottom: 5px; font-size: 13px; font-weight: 600; color: #333;">Toppings:</label>
                                ${toppingsList}
                            </div>
                        `;
                    }
                } catch (e) {

                }
            }
            
            let selectedToppingsDisplay = '';
            if (item.selectedToppings && item.selectedToppings.length > 0) {
                const toppingsText = item.selectedToppings.map(t => t.name).join(', ');
                selectedToppingsDisplay = `<div style="font-size: 11px; color: #666; margin-top: 3px;">+ ${toppingsText}</div>`;
            }
            
            div.innerHTML = `
                <div class="cart-item-info">
                    <span class="item-name">${item.name}${selectedToppingsDisplay ? '' : ''}</span>
                    ${selectedToppingsDisplay}
                    <span class="item-price">₱${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                ${sizeSelector}
                ${toppingsSelector}
                <div class="quantity-controls">
                    <button class="qty-btn minus-btn" onclick="decreaseQuantity(${index})">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="qty-btn plus-btn" onclick="increaseQuantity(${index})">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
            `;
            cartList.appendChild(div);
        });
        totalPriceEl.textContent = total.toFixed(2);
    }
    
    window.changeCartItemSize = function(index, newSize) {
        if (index < 0 || index >= cart.length) return;
        
        const item = cart[index];
        const food = foods.find(f => f.id === item.food_id || f.name === item.name);
        
        if (!food || !food.sizes) return;
        
        try {
            const sizes = JSON.parse(food.sizes);
            const newBasePrice = sizes[newSize];
            
            if (newBasePrice) {

                const toppingsTotal = (item.selectedToppings || []).reduce((sum, t) => sum + t.price, 0);
                const newPrice = newBasePrice + toppingsTotal;
                
                const toppingsKey = JSON.stringify((item.selectedToppings || []).map(t => t.name).sort());
                const existingWithNewSize = cart.find((cartItem, idx) => 
                    idx !== index && 
                    cartItem.name === item.name && 
                    cartItem.size === newSize &&
                    JSON.stringify((cartItem.selectedToppings || []).map(t => t.name).sort()) === toppingsKey
                );
                
                if (existingWithNewSize) {

                    existingWithNewSize.quantity += item.quantity;
                    cart.splice(index, 1);
                } else {

                    cart[index].size = newSize;
                    cart[index].basePrice = newBasePrice;
                    cart[index].price = newPrice;
                }
                
                localStorage.setItem('cart', JSON.stringify(cart));
                renderCart();
                updateCartBadge();
            }
        } catch (e) {
            console.error('Error changing size:', e);
        }
    }
    
    window.updateCartItemToppings = function(index) {
        if (index < 0 || index >= cart.length) return;
        
        const item = cart[index];
        const food = foods.find(f => f.id === item.food_id || f.name === item.name);
        
        if (!food || !food.toppings) return;
        
        try {
            const availableToppings = JSON.parse(food.toppings);
            const cartItemDiv = document.querySelectorAll('.cart-item')[index];
            const checkboxes = cartItemDiv.querySelectorAll('.cart-topping-checkbox:checked');
            
            const selectedToppings = [];
            checkboxes.forEach(cb => {
                selectedToppings.push({
                    name: cb.dataset.toppingName,
                    price: parseFloat(cb.dataset.toppingPrice)
                });
            });
            
            const basePrice = item.basePrice || item.price;
            const toppingsTotal = selectedToppings.reduce((sum, t) => sum + t.price, 0);
            const newPrice = basePrice + toppingsTotal;
            
            cart[index].selectedToppings = selectedToppings;
            cart[index].price = newPrice;
            
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCart();
            updateCartBadge();
        } catch (e) {
            console.error('Error updating toppings:', e);
        }
    }

    async function renderOrders() {
        pastOrdersDiv.innerHTML = '';
        
        try {
            const response = await fetch('backend/orders.php');
            const orders = await response.json();
            
            if (orders.length === 0) {
                pastOrdersDiv.innerHTML = '<p>No orders found.</p>';
                return;
            }

            orders.forEach(order => {
                const divTrack = document.createElement('div');
                divTrack.className = 'past-order-tracking';
                
                // Add receipt button for ready and completed orders
                let receiptButton = '';
                if (order.status === 'ready' || order.status === 'completed') {
                    receiptButton = `
                        <div style="margin-top: 15px; text-align: center;">
                            <button onclick="viewReceipt(${order.id})" style="
                                background: #4CAF50; 
                                color: white; 
                                border: none; 
                                padding: 10px 20px; 
                                border-radius: 5px; 
                                cursor: pointer; 
                                font-weight: bold;
                                font-size: 14px;
                                transition: background 0.3s ease;
                            " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4CAF50'">
                                📄 View Detailed Receipt
                            </button>
                        </div>
                    `;
                }
                
                divTrack.innerHTML = `
                    <h4>Tracking: ${order.tracking_number}</h4>
                    <p><strong>Customer:</strong> ${order.customer_name || 'Anonymous'}</p>
                    <p><strong>Total:</strong> ₱${parseFloat(order.total_amount).toFixed(2)}</p>
                    <p><strong>Items:</strong> ${order.items || 'N/A'}</p>
                    <p><strong>Status:</strong> 
                        <span class="status-badge ${order.status === "pending" ? "status-pending" : order.status === "ready" ? "status-ready" : "status-completed"}">${order.status}</span>
                        ${order.status === 'ready' ? '<span style="color: #4CAF50; font-weight: bold; margin-left: 10px;">✓ Receipt Available!</span>' : ''}
                    </p>
                    <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                    ${receiptButton}
                `;
                pastOrdersDiv.appendChild(divTrack);
            });
        } catch (error) {
            console.error('Error loading orders:', error);
            pastOrdersDiv.innerHTML = '<p>Error loading orders. Please try again.</p>';
        }
    }
});

function togglePanel(id) {
    const panel = document.getElementById(id);
    if (panel.classList.contains('active')) {
        panel.classList.remove('active');
        panel.style.display = 'none';
    } else {
        panel.classList.add('active');
        panel.style.display = 'block';
    }
}

// Function to view receipt for an order
window.viewReceipt = function(orderId) {
    // Announce receipt viewing with speech
    if (typeof speechService !== 'undefined' && speechService.isEnabled) {
        speechService.speak('Opening detailed receipt', { rate: 1.0 });
    }
    
    // Open receipt in new tab
    window.open(`backend/generate_receipt.php?order_id=${orderId}`, '_blank');
}