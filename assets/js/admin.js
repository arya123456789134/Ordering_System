document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('loginForm');
    const loginSection = document.getElementById('loginSection');
    const adminSection = document.getElementById('adminSection');

    async function checkLoginStatus() {
        try {
            const response = await fetch('backend/check_session.php');
            const result = await response.json();
            
            if (result.success && result.logged_in) {

                loginSection.style.display = "none";
                adminSection.style.display = "block";
                adminPanelButtons.style.display = "flex";
                loadFoods();

            } else {

                loginSection.style.display = "block";
                adminSection.style.display = "none";
                adminPanelButtons.style.display = "none";
            }
        } catch (error) {
            console.error('Error checking login status:', error);

            loginSection.style.display = "block";
            adminSection.style.display = "none";
            adminPanelButtons.style.display = "none";
        }
    }

    checkLoginStatus();

    async function checkSessionStatus() {
        try {
            const response = await fetch('backend/check_session.php');
            const result = await response.json();
            
            if (!result.success || !result.logged_in) {

                alert("Your session has expired. Please login again.");
                loginSection.style.display = "block";
                adminSection.style.display = "none";
                adminPanelButtons.style.display = "none";
                adminPanel.classList.remove('active');
            }
        } catch (error) {
            console.error('Error checking session status:', error);
        }
    }

    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        
        try {
            const response = await fetch('backend/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: user, password: pass })
            });
            
            const result = await response.json();
            
            if (result.success) {
            loginSection.style.display = "none";
            adminSection.style.display = "block";
            adminPanelButtons.style.display = "flex";
                loadFoods();

                setInterval(checkSessionStatus, 5 * 60 * 1000);
        } else {
            alert("Invalid login!");
            }
        } catch (error) {
            console.error('Login error:', error);
            alert("Login failed. Please try again.");
        }
    });

    const foodForm = document.getElementById('foodForm');
    const foodList = document.getElementById('foodList');
    const customerMenu = document.getElementById('customerMenu');

    let foods = [];

    async function loadFoods() {
        try {
            const response = await fetch('backend/foods.php');
            foods = await response.json();
    displayFoods();
        } catch (error) {
            console.error('Error loading foods:', error);
        }
    }

    async function loadOrders() {
        try {
            const response = await fetch('backend/orders.php');
            const orders = await response.json();
            renderAdminPanel(orders);
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    const hasSizesCheckbox = document.getElementById('hasSizes');
    const singlePriceSection = document.getElementById('singlePriceSection');
    const sizePriceSection = document.getElementById('sizePriceSection');
    const priceInput = document.getElementById('price');
    const priceSmallInput = document.getElementById('priceSmall');
    const priceLargeInput = document.getElementById('priceLarge');
    const priceError = document.getElementById('priceError');
    const sizePriceError = document.getElementById('sizePriceError');
    
    hasSizesCheckbox.addEventListener('change', function() {
        if (this.checked) {
            singlePriceSection.style.display = 'none';
            sizePriceSection.style.display = 'block';
            priceInput.removeAttribute('required');
            priceSmallInput.setAttribute('required', 'required');
            priceLargeInput.setAttribute('required', 'required');
        } else {
            singlePriceSection.style.display = 'block';
            sizePriceSection.style.display = 'none';
            priceInput.setAttribute('required', 'required');
            priceSmallInput.removeAttribute('required');
            priceLargeInput.removeAttribute('required');
        }
    });
    
    [priceInput, priceSmallInput, priceLargeInput].forEach(input => {
        if (input) {
            input.addEventListener('keydown', function(e) {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                }
            });
        }
    });

    priceInput.addEventListener('input', function() {
        const price = parseFloat(this.value);
        if (this.value && (isNaN(price) || price <= 0)) {
            priceError.style.display = 'block';
            priceError.classList.add('show');
            priceError.textContent = price < 0 ? 'Price cannot be negative' : 'Price must be a positive number';
            this.style.borderColor = '#e74c3c';
        } else {
            priceError.style.display = 'none';
            priceError.classList.remove('show');
            this.style.borderColor = '';
        }
    });
    
    function validateSizePrices() {
        const priceSmall = parseFloat(priceSmallInput.value);
        const priceLarge = parseFloat(priceLargeInput.value);
        let isValid = true;
        
        if (priceSmallInput.value && (isNaN(priceSmall) || priceSmall <= 0)) {
            sizePriceError.style.display = 'block';
            sizePriceError.classList.add('show');
            sizePriceError.textContent = 'Small price must be a positive number';
            priceSmallInput.style.borderColor = '#e74c3c';
            isValid = false;
        } else {
            priceSmallInput.style.borderColor = '';
        }
        
        if (priceLargeInput.value && (isNaN(priceLarge) || priceLarge <= 0)) {
            sizePriceError.style.display = 'block';
            sizePriceError.classList.add('show');
            sizePriceError.textContent = 'Large price must be a positive number';
            priceLargeInput.style.borderColor = '#e74c3c';
            isValid = false;
        } else {
            priceLargeInput.style.borderColor = '';
        }
        
        if (isValid && priceSmallInput.value && priceLargeInput.value) {
            sizePriceError.style.display = 'none';
            sizePriceError.classList.remove('show');
        }
        
        return isValid;
    }
    
    priceSmallInput.addEventListener('input', validateSizePrices);
    priceLargeInput.addEventListener('input', validateSizePrices);
    
    const toppingsContainer = document.getElementById('toppingsContainer');
    const addToppingBtn = document.getElementById('addToppingBtn');
    let toppingCount = 0;
    
    addToppingBtn.addEventListener('click', function() {
        const toppingDiv = document.createElement('div');
        toppingDiv.className = 'topping-item';
        toppingDiv.innerHTML = `
            <input type="text" class="topping-name" placeholder="Topping Name (e.g., Cheese)">
            <div class="input-with-icon" style="flex: 1;">
                <span class="currency-icon">₱</span>
                <input type="number" class="topping-price" placeholder="0.00" min="0" step="0.01" style="padding-left: 40px;">
            </div>
            <button type="button" class="remove-topping-btn">✕ Remove</button>
        `;
        
        toppingDiv.querySelector('.remove-topping-btn').addEventListener('click', function() {
            toppingDiv.remove();
        });
        
        toppingsContainer.appendChild(toppingDiv);
        toppingCount++;
    });
    
    const imageFileInput = document.getElementById('imageFile');
    const fileUploadText = document.querySelector('.file-upload-text');
    const fileUploadHint = document.querySelector('.file-upload-hint');
    
    if (imageFileInput && fileUploadText) {
        imageFileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                const fileName = this.files[0].name;
                const fileSize = (this.files[0].size / 1024 / 1024).toFixed(2);
                fileUploadText.textContent = fileName;
                fileUploadHint.textContent = `Size: ${fileSize} MB`;
                fileUploadText.style.color = '#27ae60';
            } else {
                fileUploadText.textContent = 'Choose an image file';
                fileUploadHint.textContent = 'PNG, JPG, or GIF up to 5MB';
                fileUploadText.style.color = '#2196F3';
            }
        });
    }
    
    function getToppings() {
        const toppings = [];
        const toppingItems = toppingsContainer.querySelectorAll('.topping-item');
        
        toppingItems.forEach(item => {
            const name = item.querySelector('.topping-name').value.trim();
            const price = parseFloat(item.querySelector('.topping-price').value);
            
            if (name && !isNaN(price) && price >= 0) {
                toppings.push({ name: name, price: price });
            }
        });
        
        return toppings.length > 0 ? JSON.stringify(toppings) : null;
    }

    function compressImage(file, maxWidth, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height / width) * maxWidth;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedBase64);
                };
                img.onerror = function() {
                    reject(new Error('Failed to load image'));
                };
                img.src = e.target.result;
            };
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            reader.readAsDataURL(file);
        });
    }

    foodForm.addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const category = document.getElementById('category').value.trim();
        const hasSizes = hasSizesCheckbox.checked;
        const imageFile = document.getElementById('imageFile').files[0];
        
        if (!imageFile) { 
            alert("Please select an image!"); 
            return; 
        }
        
        const maxFileSize = 10 * 1024 * 1024;
        if (imageFile.size > maxFileSize) {
            if (!confirm(`Warning: The selected image is ${(imageFile.size / 1024 / 1024).toFixed(2)}MB. It will be compressed. Continue?`)) {
                return;
            }
        }
        
        let price = null;
        let sizes = null;
        
        if (hasSizes) {
            const priceSmall = parseFloat(priceSmallInput.value);
            const priceLarge = parseFloat(priceLargeInput.value);
            
            if (!validateSizePrices() || isNaN(priceSmall) || priceSmall <= 0 || isNaN(priceLarge) || priceLarge <= 0) {
                sizePriceError.style.display = 'block';
                sizePriceError.textContent = 'Both prices must be positive numbers';
                return;
            }
            
            sizes = JSON.stringify({
                small: priceSmall,
                large: priceLarge
            });

            price = priceSmall;
        } else {
            price = parseFloat(priceInput.value);
            
            if (isNaN(price) || price <= 0) {
                priceError.style.display = 'block';
                priceError.textContent = price < 0 ? 'Price cannot be negative' : 'Price must be a positive number';
                priceInput.style.borderColor = '#e74c3c';
                priceInput.focus();
                return;
            }
        }
        
        compressImage(imageFile, 1024, 0.8).then(compressedBase64 => {
            try {
                const toppings = getToppings();
                
                fetch('backend/foods.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        name, 
                        category, 
                        price, 
                        sizes: sizes,
                        toppings: toppings,
                        image: compressedBase64 
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(err.error || 'Failed to upload image. File may be too large.');
                        });
                    }
                    return response.json();
                })
                .then(result => {
                    if (result.success) {
                        loadFoods();
                        foodForm.reset();
                        hasSizesCheckbox.checked = false;
                        singlePriceSection.style.display = 'block';
                        sizePriceSection.style.display = 'none';
                        priceInput.setAttribute('required', 'required');
                        priceSmallInput.removeAttribute('required');
                        priceLargeInput.removeAttribute('required');
                        toppingsContainer.innerHTML = '';
                        toppingCount = 0;
                        if (fileUploadText && fileUploadHint) {
                            fileUploadText.textContent = 'Choose an image file';
                            fileUploadHint.textContent = 'PNG, JPG, or GIF up to 5MB';
                            fileUploadText.style.color = '#2196F3';
                        }
                    } else {
                        alert("Failed to add food item: " + (result.error || 'Unknown error'));
                    }
                })
                .catch(error => {
                    console.error('Error adding food:', error);
                    alert("Failed to add food item: " + error.message);
                });
            } catch (error) {
                console.error('Error processing food item:', error);
                alert("Failed to add food item: " + error.message);
            }
        }).catch(error => {
            console.error('Error compressing image:', error);
            alert("Failed to process image: " + error.message);
        });
    });

    function displayFoods() {
        foodList.innerHTML = '';
        const grouped = {};
        const displayNames = {};
        foods.forEach(f => {
            if (!f.id) f.id = Date.now() + Math.random();
            const key = f.category.trim().toLowerCase();
            if (!grouped[key]) { grouped[key] = []; displayNames[key] = f.category.trim(); }
            grouped[key].push(f);
        });
        const categories = Object.keys(grouped);
        categories.forEach(catKey => {
            const catDiv = document.createElement('div');
            catDiv.className = 'food-container';
            catDiv.innerHTML = `<h3>${displayNames[catKey]}</h3>`;
            grouped[catKey].forEach(food => {
                const div = document.createElement('div');
                div.className = 'food-item';
                
                let priceDisplay = `₱${parseFloat(food.price).toFixed(2)}`;
                if (food.sizes) {
                    try {
                        const sizes = JSON.parse(food.sizes);
                        priceDisplay = `Small: ₱${parseFloat(sizes.small).toFixed(2)} | Large: ₱${parseFloat(sizes.large).toFixed(2)}`;
                    } catch (e) {

                    }
                }
                
                let toppingsDisplay = '';
                if (food.toppings) {
                    try {
                        const toppings = JSON.parse(food.toppings);
                        if (toppings.length > 0) {
                            toppingsDisplay = `<div style="font-size: 12px; color: #666; margin-top: 5px;">Toppings: ${toppings.map(t => t.name).join(', ')}</div>`;
                        }
                    } catch (e) {

                    }
                }
                
                div.innerHTML = `
                    <img src="${food.image}" alt="${food.name}">
                    <div class="food-info">
                        <strong>${food.name}</strong>
                        <span>${priceDisplay}</span>
                        ${toppingsDisplay}
                    </div>
                    <button class="delete-btn" onclick="deleteFood(${food.id})">Delete</button>
                `;
                catDiv.appendChild(div);
            });
            foodList.appendChild(catDiv);
        });
    }

    window.deleteFood = async function(id) {
        try {
            const response = await fetch(`backend/foods.php?id=${id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                loadFoods();
            } else {
                alert("Failed to delete food item");
            }
        } catch (error) {
            console.error('Error deleting food:', error);
            alert("Failed to delete food item");
        }
    }

    const adminPanelButtons = document.createElement('div');
    adminPanelButtons.className = 'admin-panel-buttons';
    adminPanelButtons.style.display = 'none';
    adminPanelButtons.innerHTML = `
        <button id="viewCustomerOrdersBtn">Customer Orders</button>
        <button id="viewOrderHistoryBtn">Order History</button>
        <button id="changePasswordBtn">Change Password</button>
        <button id="logoutBtn">Logout</button>
    `;
    document.body.appendChild(adminPanelButtons);

    const adminPanel = document.createElement('div');
    adminPanel.className = 'admin-panel';
    adminPanel.innerHTML = `
        <h3 id="adminPanelTitle">Admin Panel</h3>
        <div id="adminPanelContent"></div>
    `;
    document.body.appendChild(adminPanel);

    const receiptBox = document.createElement('div');
    receiptBox.className = 'receipt-box';
    receiptBox.id = 'receiptSection';
    receiptBox.style.display = 'none';
    receiptBox.innerHTML = `
        <h3>Receipts</h3>
        <div id="receiptList"></div>
    `;
    document.body.appendChild(receiptBox);

    const adminPanelTitle = document.getElementById('adminPanelTitle');
    const adminPanelContent = document.getElementById('adminPanelContent');
    const receiptSection = document.getElementById('receiptList');
    const viewCustomerOrdersBtn = document.getElementById('viewCustomerOrdersBtn');

    function renderAdminPanel(orders = []) {
        adminPanelContent.innerHTML = '';
        adminPanelTitle.textContent = 'Customer Orders';

        let totalRevenue = 0;
        orders.forEach(order => {
            totalRevenue += parseFloat(order.total_amount) || 0;
        });

        const revenueEl = document.createElement('p');
        revenueEl.textContent = `Total Revenue: ₱${totalRevenue.toFixed(2)}`;
        revenueEl.style.fontWeight = 'bold';
        adminPanelContent.appendChild(revenueEl);

        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = '🔄 Refresh Orders';
        refreshBtn.style.marginBottom = '10px';
        refreshBtn.style.padding = '8px 16px';
        refreshBtn.style.backgroundColor = '#2196F3';
        refreshBtn.style.color = 'white';
        refreshBtn.style.border = 'none';
        refreshBtn.style.borderRadius = '6px';
        refreshBtn.style.cursor = 'pointer';
        refreshBtn.style.fontWeight = 'bold';
        refreshBtn.style.transition = 'all 0.3s ease';
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.textContent = '🔄 Refreshing...';
            refreshBtn.disabled = true;
            refreshBtn.style.backgroundColor = '#ccc';
            try {
                await loadOrders();
                refreshBtn.textContent = '✅ Refreshed!';
                setTimeout(() => {
                    refreshBtn.textContent = '🔄 Refresh Orders';
                    refreshBtn.disabled = false;
                    refreshBtn.style.backgroundColor = '#2196F3';
                }, 1500);
            } catch (error) {
                refreshBtn.textContent = '❌ Error';
                setTimeout(() => {
                    refreshBtn.textContent = '🔄 Refresh Orders';
                    refreshBtn.disabled = false;
                    refreshBtn.style.backgroundColor = '#2196F3';
                }, 2000);
            }
        });
        adminPanelContent.appendChild(refreshBtn);

        if (orders.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'No orders yet.';
            adminPanelContent.appendChild(p);
        } else {
            orders.forEach(order => {
                const divTrack = document.createElement('div');
                divTrack.className = 'customer-tracking';
                divTrack.innerHTML = `
                    <h4>Tracking: ${order.tracking_number}</h4>
                    <p><strong>Customer:</strong> ${order.customer_name || 'Anonymous'}</p>
                    <p><strong>Total:</strong> ₱${parseFloat(order.total_amount).toFixed(2)}</p>
                    <p><strong>Items:</strong> ${order.items || 'N/A'}</p>
                    <p><strong>Status:</strong> 
                        <span class="status-badge ${order.status === "pending" ? "status-pending" : order.status === "ready" ? "status-ready" : order.status === "completed" ? "status-completed" : "status-cancelled"}">${order.status}</span>
                    </p>
                    <div class="order-actions">
                        ${order.status === "pending" ? `<button onclick="updateOrderStatus(${order.id}, 'ready')">Mark Ready</button>` : ""}
                        ${order.status === "ready" ? `<button onclick="updateOrderStatus(${order.id}, 'completed')">Mark Completed</button>` : ""}
                        ${order.status !== "cancelled" && order.status !== "completed" ? `<button class="cancel-btn" onclick="cancelOrder(${order.id})">Cancel Order</button>` : ""}
                        <button class="pdf-receipt-btn" onclick="generatePDFReceipt(${order.id})" style="background: #4CAF50 !important; color: white !important; padding: 4px 10px !important; font-size: 11px !important; border: none !important; border-radius: 3px !important; cursor: pointer !important; font-weight: 600 !important; transition: all 0.3s ease !important; min-width: 140px !important; text-align: center !important; height: 28px !important; display: flex !important; align-items: center !important; justify-content: center !important; margin-top: 8px !important;">📄 Generate Receipt</button>
                        <button class="delete-btn" onclick="deleteOrder(${order.id})" style="background: #D32F2F !important; color: white !important; padding: 4px 10px !important; font-size: 11px !important; border: none !important; border-radius: 3px !important; cursor: pointer !important; font-weight: 600 !important; transition: all 0.3s ease !important; min-width: 80px !important; text-align: center !important; height: 28px !important; display: flex !important; align-items: center !important; justify-content: center !important; margin-top: 8px !important;">Delete Order</button>
                    </div>
                `;
                adminPanelContent.appendChild(divTrack);
            });
        }

        adminPanel.classList.add('active');
    }

    window.updateOrderStatus = async function(orderId, newStatus) {
        try {
            const response = await fetch('backend/orders.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_id: orderId,
                    status: newStatus
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // If order is marked as ready, automatically generate receipt
                if (newStatus === 'ready') {
                    // Show confirmation that receipt is being generated
                    const confirmGenerate = confirm('Order marked as ready! Would you like to automatically generate the receipt for the customer?');
                    if (confirmGenerate) {
                        // Open receipt in new tab
                        window.open(`backend/generate_receipt.php?order_id=${orderId}&autoprint=1`, '_blank');
                        alert('Receipt generated! The customer can now view their detailed receipt.');
                    }
                }
                loadOrders();
            } else {
                alert("Failed to update order status");
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            alert("Failed to update order status");
        }
    }

    window.cancelOrder = async function(orderId) {
        if (!confirm('Are you sure you want to cancel this order?')) {
            return;
        }
        
        try {
            const response = await fetch('backend/orders.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_id: orderId,
                    action: 'cancel'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Order cancelled successfully');
                loadOrders();
            } else {
                alert("Failed to cancel order: " + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert("Failed to cancel order");
        }
    }

    window.deleteOrder = async function(orderId) {
        if (!confirm('Are you sure you want to permanently delete this order? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch('backend/orders.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_id: orderId,
                    action: 'delete'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Order deleted successfully');
                loadOrders();
            } else {
                alert("Failed to delete order: " + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            alert("Failed to delete order");
        }
    }

    window.generatePDFReceipt = function(orderId) {

        window.open(`backend/generate_receipt.php?order_id=${orderId}`, '_blank');
    }

    function generateReceipt(order) {
        const receiptDiv = document.createElement('div');
        receiptDiv.className = "receipt";
        receiptDiv.innerHTML = `
            <h4>Receipt - ${order.tracking_number}</h4>
            <p><strong>Customer:</strong> ${order.customer_name || 'Anonymous'}</p>
            <p><strong>Items:</strong> ${order.items || 'N/A'}</p>
            <p><strong>Total:</strong> ₱${parseFloat(order.total_amount).toFixed(2)}</p>
            <p><strong>Status:</strong> ${order.status}</p>
        `;

        const printBtn = document.createElement('button');
        printBtn.textContent = "Print Receipt";
        printBtn.addEventListener('click', () => {
            const w = window.open("", "PrintReceipt");
            w.document.write(`<pre>${receiptDiv.innerHTML}</pre>`);
            w.document.close();
            w.print();
        });
        receiptDiv.appendChild(printBtn);

        receiptSection.appendChild(receiptDiv);
    }

    viewCustomerOrdersBtn.addEventListener('click', loadOrders);

    const viewOrderHistoryBtn = document.getElementById('viewOrderHistoryBtn');
    if (viewOrderHistoryBtn) {
        viewOrderHistoryBtn.addEventListener('click', () => {
            loadOrderHistory();
        });
    } else {
        console.error('Order History button not found!');
    }

    async function loadOrderHistory(filter = 'all', date = null) {
        try {
            let url = `backend/order_history.php?filter=${filter}`;
            if (date) {
                url += `&date=${date}`;
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                renderOrderHistory(data);
            } else {
                alert('Failed to load order history: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error loading order history:', error);
            alert('Failed to load order history');
        }
    }

    function renderOrderHistory(data) {
        adminPanelContent.innerHTML = '';
        adminPanelTitle.textContent = 'Order History';
        adminPanel.classList.add('active');

        const filterControls = document.createElement('div');
        filterControls.className = 'order-history-filters';
        filterControls.innerHTML = `
            <div class="filter-group">
                <label>Filter by:</label>
                <select id="historyFilter" onchange="updateOrderHistoryFilter()">
                    <option value="all" ${data.filter === 'all' ? 'selected' : ''}>All Orders</option>
                    <option value="day" ${data.filter === 'day' ? 'selected' : ''}>By Day</option>
                    <option value="month" ${data.filter === 'month' ? 'selected' : ''}>By Month</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Date:</label>
                <input type="date" id="historyDate" value="${data.date}" onchange="updateOrderHistoryFilter()">
            </div>
            <button onclick="updateOrderHistoryFilter()" class="refresh-history-btn">🔄 Refresh</button>
        `;
        adminPanelContent.appendChild(filterControls);

        const summarySection = document.createElement('div');
        summarySection.className = 'order-history-summary';
        summarySection.innerHTML = `
            <h4>Sales Summary</h4>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">Total Sales:</span>
                    <span class="summary-value">₱${parseFloat(data.summary.total_sales).toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Orders:</span>
                    <span class="summary-value">${data.summary.total_orders}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Completed Sales:</span>
                    <span class="summary-value completed">₱${parseFloat(data.summary.completed_sales).toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Completed Orders:</span>
                    <span class="summary-value">${data.summary.completed_orders}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Pending Sales:</span>
                    <span class="summary-value pending">₱${parseFloat(data.summary.pending_sales).toFixed(2)}</span>
                </div>
            </div>
        `;
        adminPanelContent.appendChild(summarySection);

        if (data.filter === 'month' && data.daily_breakdown && data.daily_breakdown.length > 0) {
            const dailySection = document.createElement('div');
            dailySection.className = 'daily-breakdown';
            dailySection.innerHTML = '<h4>Daily Breakdown</h4>';
            
            const dailyTable = document.createElement('table');
            dailyTable.className = 'daily-table';
            dailyTable.innerHTML = `
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Orders</th>
                        <th>Total Sales</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.daily_breakdown.map(day => `
                        <tr>
                            <td>${new Date(day.order_date).toLocaleDateString()}</td>
                            <td>${day.order_count}</td>
                            <td>₱${parseFloat(day.daily_total).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            dailySection.appendChild(dailyTable);
            adminPanelContent.appendChild(dailySection);
        }

        const ordersSection = document.createElement('div');
        ordersSection.className = 'order-history-list';
        ordersSection.innerHTML = '<h4>Order Details</h4>';
        
        if (data.orders.length === 0) {
            ordersSection.innerHTML += '<p class="no-orders">No orders found for the selected period.</p>';
        } else {
            data.orders.forEach(order => {
                const orderDiv = document.createElement('div');
                orderDiv.className = 'history-order-item';
                orderDiv.innerHTML = `
                    <div class="history-order-header">
                        <span class="order-tracking">${order.tracking_number}</span>
                        <span class="status-badge ${order.status === "pending" ? "status-pending" : order.status === "ready" ? "status-ready" : order.status === "completed" ? "status-completed" : "status-cancelled"}">${order.status}</span>
                    </div>
                    <div class="history-order-details">
                        <p><strong>Customer:</strong> ${order.customer_name || 'Anonymous'}</p>
                        <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                        <p><strong>Items:</strong> ${order.items || 'N/A'}</p>
                        <p><strong>Total:</strong> ₱${parseFloat(order.total_amount).toFixed(2)}</p>
                    </div>
                `;
                ordersSection.appendChild(orderDiv);
            });
        }
        
        adminPanelContent.appendChild(ordersSection);
    }

    window.updateOrderHistoryFilter = function() {
        const filter = document.getElementById('historyFilter').value;
        const date = document.getElementById('historyDate').value;
        loadOrderHistory(filter, date);
    };

    document.getElementById('changePasswordBtn').addEventListener('click', () => {
        showChangePasswordForm();
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        logout();
    });

    function showChangePasswordForm() {
        const formHTML = `
            <div class="change-password-form">
                <form id="changePasswordForm">
                    <input type="password" id="currentPassword" placeholder="Current Password" required>
                    <input type="password" id="newPassword" placeholder="New Password" required>
                    <input type="password" id="confirmPassword" placeholder="Confirm New Password" required>
                    <div class="form-buttons">
                        <button type="submit">Change Password</button>
                        <button type="button" onclick="closeChangePasswordForm()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        
        adminPanelContent.innerHTML = formHTML;
        adminPanelTitle.textContent = 'Change Password';
        adminPanel.classList.add('active');
        
        document.getElementById('changePasswordForm').addEventListener('submit', handlePasswordChange);
    }

    async function handlePasswordChange(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            alert("New passwords don't match!");
            return;
        }
        
        if (newPassword.length < 4) {
            alert("New password must be at least 4 characters long!");
            return;
        }
        
        try {
            const response = await fetch('backend/change_password.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert("Password changed successfully!");
                closeChangePasswordForm();
            } else {
                alert(result.error || "Failed to change password");
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert("Failed to change password");
        }
    }

    window.closeChangePasswordForm = function() {
        adminPanel.classList.remove('active');
        loadOrders();
    };

    async function logout() {
        if (confirm("Are you sure you want to logout?")) {
            try {

                const response = await fetch('backend/logout.php', {
                    method: 'POST'
                });
                const result = await response.json();
                
                if (result.success) {

                    adminSection.style.display = "none";
                    loginSection.style.display = "block";
                    adminPanelButtons.style.display = "none";
                    
                    document.getElementById('username').value = '';
                    document.getElementById('password').value = '';
                    
                    adminPanel.classList.remove('active');
                    
                    alert("Logged out successfully!");
                } else {
                    alert("Logout failed. Please try again.");
                }
            } catch (error) {
                console.error('Logout error:', error);
                alert("Logout failed. Please try again.");
            }
        }
    }

    document.addEventListener('click', (e) => {
        if (!adminPanel.contains(e.target) && !adminPanelButtons.contains(e.target) && e.target !== viewCustomerOrdersBtn && e.target !== viewOrderHistoryBtn) {
            adminPanel.classList.remove('active');
        }
    });

});