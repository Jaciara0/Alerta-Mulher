// Emergency Alert App - Disguised as Food Delivery
class EmergencyApp {
    constructor() {
        this.cart = [];
        this.emergencyContacts = this.loadContacts();
        this.currentLocation = null;
        this.isEmergencyMode = false;
        
        this.init();
        this.setupGeolocation();
        this.registerServiceWorker();
    }

    init() {
        this.setupEventListeners();
        this.updateCartUI();
        this.updateContactsUI();
        this.updateLocationDisplay();
        
        // Initialize app with normal mode
        this.showScreen('home');
    }

    setupEventListeners() {
        // Emergency button (disguised as menu button)
        document.getElementById('emergency-btn').addEventListener('click', () => {
            this.showEmergencyMenu();
        });

        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                this.handleNavigation(screen);
            });
        });

        // Back buttons
        document.getElementById('back-btn').addEventListener('click', () => {
            this.showScreen('home');
        });

        document.getElementById('cart-back-btn').addEventListener('click', () => {
            this.showScreen('menu');
        });

        document.getElementById('contacts-back-btn').addEventListener('click', () => {
            this.showScreen('cart');
        });

        // Menu item buttons
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const menuItem = e.currentTarget.closest('.menu-item');
                const emergencyType = menuItem.dataset.emergency;
                this.addToCart(emergencyType, menuItem);
            });
        });

        // Cart button
        document.querySelector('.cart-btn').addEventListener('click', () => {
            if (this.cart.length > 0) {
                this.showScreen('cart');
            }
        });

        // Order actions
        document.getElementById('place-order-btn').addEventListener('click', () => {
            this.showConfirmationModal();
        });

        document.getElementById('call-180-btn').addEventListener('click', () => {
            this.callEmergencyNumber();
        });

        // Contact management
        document.getElementById('add-contact-btn').addEventListener('click', () => {
            this.showScreen('contacts');
        });

        document.getElementById('contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveContact();
        });

        // Modal controls
        document.getElementById('cancel-order').addEventListener('click', () => {
            this.hideModal('confirmation-modal');
        });

        document.getElementById('confirm-order').addEventListener('click', () => {
            this.processEmergencyOrder();
        });

        document.getElementById('close-success').addEventListener('click', () => {
            this.hideModal('success-modal');
            this.showScreen('home');
            this.clearCart();
        });

        // Category clicks for normal mode
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                // In normal mode, just show a loading state
                this.showNormalCategory();
            });
        });

        // Restaurant clicks for normal mode  
        document.querySelectorAll('.restaurant-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showNormalRestaurant();
            });
        });
    }

    setupGeolocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    };
                    this.updateLocationDisplay();
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    this.updateLocationDisplay('Localização não disponível');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );

            // Watch position for real-time updates
            this.watchId = navigator.geolocation.watchPosition(
                (position) => {
                    this.currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    };
                },
                null,
                {
                    enableHighAccuracy: true,
                    maximumAge: 60000
                }
            );
        }
    }

    updateLocationDisplay(customText = null) {
        const locationText = document.getElementById('location-text');
        const deliveryLocation = document.getElementById('delivery-location');
        
        if (customText) {
            locationText.textContent = customText;
            if (deliveryLocation) {
                deliveryLocation.textContent = customText;
            }
            return;
        }

        if (this.currentLocation) {
            const locationStr = `Lat: ${this.currentLocation.latitude.toFixed(4)}, Lng: ${this.currentLocation.longitude.toFixed(4)}`;
            locationText.textContent = `📍 Localização atual`;
            if (deliveryLocation) {
                deliveryLocation.textContent = locationStr;
            }
        } else {
            locationText.textContent = 'Buscando localização...';
            if (deliveryLocation) {
                deliveryLocation.textContent = 'Buscando localização...';
            }
        }
    }

    showEmergencyMenu() {
        this.isEmergencyMode = true;
        this.showScreen('menu');
        
        // Add visual feedback that emergency mode is active
        document.getElementById('emergency-btn').style.background = 'rgba(220, 53, 69, 0.3)';
        
        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }

    addToCart(emergencyType, menuItem) {
        const itemInfo = menuItem.querySelector('.item-info');
        const title = itemInfo.querySelector('h4').textContent;
        const description = itemInfo.querySelector('p').textContent;
        const price = itemInfo.querySelector('.price').textContent;

        const cartItem = {
            id: Date.now(),
            type: emergencyType,
            title: title,
            description: description,
            price: price,
            timestamp: new Date().toISOString()
        };

        this.cart.push(cartItem);
        this.updateCartUI();

        // Show cart screen
        this.showScreen('cart');

        // Visual feedback
        const addBtn = menuItem.querySelector('.add-btn');
        const originalText = addBtn.textContent;
        addBtn.textContent = 'Adicionado!';
        addBtn.style.background = '#28a745';
        
        setTimeout(() => {
            addBtn.textContent = originalText;
            addBtn.style.background = '';
        }, 1000);
    }

    updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        const cartItems = document.getElementById('cart-items');
        
        cartCount.textContent = this.cart.length;
        cartCount.style.display = this.cart.length > 0 ? 'flex' : 'none';

        if (cartItems) {
            cartItems.innerHTML = '';
            
            if (this.cart.length === 0) {
                cartItems.innerHTML = `
                    <div class="empty-state">
                        <p>Nenhum item no pedido</p>
                        <p>Selecione itens do cardápio para continuar</p>
                    </div>
                `;
                return;
            }

            this.cart.forEach(item => {
                const cartItemElement = document.createElement('div');
                cartItemElement.className = 'cart-item';
                cartItemElement.innerHTML = `
                    <div class="cart-item-info">
                        <h4>${item.title}</h4>
                        <p>${item.description}</p>
                        <span class="price">${item.price}</span>
                    </div>
                    <button class="remove-btn" onclick="app.removeFromCart(${item.id})">
                        Remover
                    </button>
                `;
                cartItems.appendChild(cartItemElement);
            });
        }
    }

    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.updateCartUI();
    }

    clearCart() {
        this.cart = [];
        this.updateCartUI();
        this.isEmergencyMode = false;
        document.getElementById('emergency-btn').style.background = '';
    }

    showConfirmationModal() {
        if (this.cart.length === 0) {
            alert('Adicione itens ao pedido primeiro');
            return;
        }

        const selectedContacts = this.getSelectedContacts();
        if (selectedContacts.length === 0) {
            alert('Selecione pelo menos um contato de emergência');
            return;
        }

        this.showModal('confirmation-modal');
    }

    processEmergencyOrder() {
        this.hideModal('confirmation-modal');
        this.showLoading();

        // Simulate processing time
        setTimeout(() => {
            this.sendEmergencyAlert();
            this.hideLoading();
            this.showModal('success-modal');
        }, 2000);
    }

    sendEmergencyAlert() {
        const selectedContacts = this.getSelectedContacts();
        const orderNotes = document.getElementById('order-notes').value;
        const shareLocation = document.getElementById('share-location').checked;

        const alertData = {
            timestamp: new Date().toISOString(),
            incidents: this.cart.map(item => ({
                type: item.type,
                title: item.title,
                description: item.description
            })),
            notes: orderNotes,
            location: shareLocation ? this.currentLocation : null,
            contacts: selectedContacts,
            urgency: this.cart.some(item => item.type === 'immediate-danger') ? 'CRITICAL' : 'HIGH'
        };

        // In a real app, this would send to your backend
        console.log('Emergency Alert Data:', alertData);

        // Store locally for record keeping
        this.storeEmergencyRecord(alertData);

        // Send notifications to contacts
        this.notifyEmergencyContacts(alertData);

        // If critical, auto-call 180
        if (alertData.urgency === 'CRITICAL') {
            setTimeout(() => {
                this.callEmergencyNumber();
            }, 1000);
        }
    }

    storeEmergencyRecord(alertData) {
        const records = JSON.parse(localStorage.getItem('emergency_records') || '[]');
        records.push(alertData);
        
        // Keep only last 50 records for privacy
        if (records.length > 50) {
            records.splice(0, records.length - 50);
        }
        
        localStorage.setItem('emergency_records', JSON.stringify(records));
    }

    notifyEmergencyContacts(alertData) {
        // In a real app, this would use push notifications or SMS API
        alertData.contacts.forEach(contact => {
            console.log(`Notifying ${contact.name} (${contact.phone}):`, {
                message: this.generateAlertMessage(alertData),
                location: alertData.location
            });
            
            // For demo purposes, show in console
            console.log(`SMS to ${contact.phone}: ALERTA DE EMERGÊNCIA - ${contact.name}, uma pessoa de confiança precisa de ajuda. Localização: ${alertData.location ? `${alertData.location.latitude}, ${alertData.location.longitude}` : 'Não compartilhada'}. Contate imediatamente.`);
        });
    }

    generateAlertMessage(alertData) {
        const incidentTypes = alertData.incidents.map(i => i.title).join(', ');
        return `ALERTA EMERGÊNCIA: Incidentes reportados - ${incidentTypes}. ${alertData.notes ? 'Obs: ' + alertData.notes : ''} Hora: ${new Date(alertData.timestamp).toLocaleString()}`;
    }

    callEmergencyNumber() {
        // Central de Atendimento à Mulher - 180
        if (confirm('Ligar para a Central de Atendimento à Mulher (180)?')) {
            window.location.href = 'tel:180';
        }
    }

    getSelectedContacts() {
        const checkboxes = document.querySelectorAll('.contact-checkbox input:checked');
        return Array.from(checkboxes).map(checkbox => {
            const contactItem = checkbox.closest('.contact-checkbox');
            const name = contactItem.querySelector('h4').textContent;
            const phone = contactItem.querySelector('p').textContent;
            return { name, phone };
        });
    }

    // Contact Management
    saveContact() {
        const name = document.getElementById('contact-name').value.trim();
        const phone = document.getElementById('contact-phone').value.trim();
        const relation = document.getElementById('contact-relation').value;

        if (!name || !phone) {
            alert('Preencha nome e telefone');
            return;
        }

        const contact = {
            id: Date.now(),
            name,
            phone,
            relation,
            dateAdded: new Date().toISOString()
        };

        this.emergencyContacts.push(contact);
        this.saveContacts();
        this.updateContactsUI();

        // Reset form
        document.getElementById('contact-form').reset();

        // Show success message
        alert('Contato salvo com sucesso!');
    }

    deleteContact(contactId) {
        if (confirm('Excluir este contato?')) {
            this.emergencyContacts = this.emergencyContacts.filter(c => c.id !== contactId);
            this.saveContacts();
            this.updateContactsUI();
        }
    }

    loadContacts() {
        return JSON.parse(localStorage.getItem('emergency_contacts') || '[]');
    }

    saveContacts() {
        localStorage.setItem('emergency_contacts', JSON.stringify(this.emergencyContacts));
    }

    updateContactsUI() {
        const emergencyContactsDiv = document.getElementById('emergency-contacts');
        const contactsList = document.getElementById('contacts-list');

        // Update cart screen contacts
        if (emergencyContactsDiv) {
            emergencyContactsDiv.innerHTML = '';
            
            if (this.emergencyContacts.length === 0) {
                emergencyContactsDiv.innerHTML = '<p>Nenhum contato cadastrado</p>';
                return;
            }

            this.emergencyContacts.forEach(contact => {
                const contactElement = document.createElement('div');
                contactElement.className = 'contact-checkbox';
                contactElement.innerHTML = `
                    <input type="checkbox" id="contact-${contact.id}" checked>
                    <div class="contact-info">
                        <h4>${contact.name}</h4>
                        <p>${contact.phone} - ${this.getRelationText(contact.relation)}</p>
                    </div>
                `;
                emergencyContactsDiv.appendChild(contactElement);
            });
        }

        // Update contacts management screen
        if (contactsList) {
            contactsList.innerHTML = '';
            
            if (this.emergencyContacts.length === 0) {
                contactsList.innerHTML = '<p>Nenhum contato salvo</p>';
                return;
            }

            this.emergencyContacts.forEach(contact => {
                const contactElement = document.createElement('div');
                contactElement.className = 'contact-item';
                contactElement.innerHTML = `
                    <div class="contact-details">
                        <h4>${contact.name}</h4>
                        <p>${contact.phone} - ${this.getRelationText(contact.relation)}</p>
                    </div>
                    <button class="delete-contact" onclick="app.deleteContact(${contact.id})">
                        Excluir
                    </button>
                `;
                contactsList.appendChild(contactElement);
            });
        }
    }

    getRelationText(relation) {
        const relations = {
            family: 'Família',
            friend: 'Amigo(a)',
            colleague: 'Colega',
            neighbor: 'Vizinho(a)',
            other: 'Outro'
        };
        return relations[relation] || relation;
    }

    // Navigation and UI
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        document.getElementById(`${screenId}-screen`).classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeNavBtn = document.querySelector(`[data-screen="${screenId}"]`);
        if (activeNavBtn) {
            activeNavBtn.classList.add('active');
        }
    }

    handleNavigation(screen) {
        switch (screen) {
            case 'home':
                this.showScreen('home');
                this.isEmergencyMode = false;
                document.getElementById('emergency-btn').style.background = '';
                break;
            case 'orders':
                this.showOrderHistory();
                break;
            case 'favorites':
                this.showFavorites();
                break;
            case 'profile':
                this.showProfile();
                break;
            default:
                this.showScreen('home');
        }
    }

    showOrderHistory() {
        // For normal mode, show fake order history
        // For emergency mode, could show emergency records (if appropriate)
        alert('Histórico de pedidos em desenvolvimento');
    }

    showFavorites() {
        alert('Favoritos em desenvolvimento');
    }

    showProfile() {
        alert('Perfil em desenvolvimento');
    }

    showNormalCategory() {
        alert('Carregando restaurantes...');
    }

    showNormalRestaurant() {
        alert('Carregando cardápio...');
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.remove('active');
    }

    // Service Worker Registration
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('sw.js');
                console.log('Service Worker registered:', registration);
                
                // Request notification permission
                if ('Notification' in window) {
                    const permission = await Notification.requestPermission();
                    console.log('Notification permission:', permission);
                }
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    // PWA Install Prompt
    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show custom install button
            const installBtn = document.createElement('button');
            installBtn.textContent = 'Instalar App';
            installBtn.className = 'install-btn';
            installBtn.onclick = async () => {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log('Install prompt outcome:', outcome);
                deferredPrompt = null;
                installBtn.remove();
            };
            
            document.querySelector('.app-header').appendChild(installBtn);
        });
    }
}

// Initialize the app
const app = new EmergencyApp();

// Setup install prompt
app.setupInstallPrompt();

// Keyboard shortcuts for emergency access
document.addEventListener('keydown', (e) => {
    // Ctrl + Shift + E for emergency mode
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        app.showEmergencyMenu();
    }
    
    // Escape to go back
    if (e.key === 'Escape') {
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen && activeScreen.id !== 'home-screen') {
            app.showScreen('home');
        }
    }
});

// Handle app going offline/online
window.addEventListener('online', () => {
    console.log('App is online');
    // Could sync emergency records when back online
});

window.addEventListener('offline', () => {
    console.log('App is offline');
    // App continues to work offline
});

// Privacy: Clear sensitive data on page unload if not in emergency
window.addEventListener('beforeunload', () => {
    if (!app.isEmergencyMode) {
        // Clear any temporary sensitive data
        sessionStorage.clear();
    }
});
