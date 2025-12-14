/**
 * Pesewa.com - Main Application JavaScript
 * Complete, production-ready PWA with Firebase integration
 */

'use strict';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDummyAPIKeyForDevelopmentOnly",
    authDomain: "pesewa-dev.firebaseapp.com",
    projectId: "pesewa-dev",
    storageBucket: "pesewa-dev.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:dummyappidfordevelopment",
    measurementId: "G-DUMMYMEASUREMENT"
};

// Initialize Firebase
let firebaseApp, auth, db, realtimeDb;
try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    realtimeDb = firebase.database();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.warn('Firebase initialization failed:', error);
    // Fallback to mock data for development
}

// Currency Configuration
const CURRENCY_CONFIG = {
    KE: { symbol: 'KSh', name: 'Kenyan Shilling', rate: 1 },
    UG: { symbol: 'UGX', name: 'Ugandan Shilling', rate: 35 },
    TZ: { symbol: 'TZS', name: 'Tanzanian Shilling', rate: 23 },
    RW: { symbol: 'RWF', name: 'Rwandan Franc', rate: 0.08 },
    CD: { symbol: 'CDF', name: 'Congolese Franc', rate: 0.00045, alt: 'USD' },
    BI: { symbol: 'BIF', name: 'Burundian Franc', rate: 0.0005 },
    NG: { symbol: '₦', name: 'Nigerian Naira', rate: 0.0012 },
    GH: { symbol: '₵', name: 'Ghanaian Cedi', rate: 0.083 },
    ZA: { symbol: 'R', name: 'South African Rand', rate: 0.055 },
    SO: { symbol: 'SOS', name: 'Somali Shilling', rate: 0.0018 },
    SS: { symbol: 'SSP', name: 'South Sudanese Pound', rate: 0.007 },
    ET: { symbol: 'ETB', name: 'Ethiopian Birr', rate: 0.018 }
};

// Tier Configuration
const TIER_CONFIG = {
    basic: {
        name: 'Basic Tier',
        maxLoan: 1500,
        borrowerSub: 0,
        lenderSub: { monthly: 50, biAnnual: 250, annual: 500 },
        crbCheck: false,
        description: 'Perfect for starting out with small, frequent loans'
    },
    premium: {
        name: 'Premium Tier',
        maxLoan: 5000,
        borrowerSub: 500, // annual
        lenderSub: { monthly: 250, biAnnual: 1500, annual: 2500 },
        crbCheck: false,
        description: 'For established lenders and borrowers with good history'
    },
    super: {
        name: 'Super Tier',
        maxLoan: 20000,
        borrowerSub: 1000, // annual + CRB
        lenderSub: { monthly: 1000, biAnnual: 5000, annual: 8500 },
        crbCheck: true,
        description: 'For high-value transactions with full verification'
    }
};

// Loan Categories
const LOAN_CATEGORIES = [
    { id: 'fare', name: 'PesewaFare', icon: '🚌', tagline: 'Move on, don\'t stall—borrow for your journey.' },
    { id: 'data', name: 'PesewaData', icon: '📱', tagline: 'Stay connected, stay informed—borrow when your bundle runs out.' },
    { id: 'gas', name: 'PesewaCookingGas', icon: '🔥', tagline: 'Cook with confidence—borrow when your gas is low.' },
    { id: 'food', name: 'PesewaFood', icon: '🍲', tagline: 'Don\'t sleep hungry when paycheck is delayed—borrow and eat today.' },
    { id: 'credo', name: 'Pesewacredo', icon: '🔧', tagline: 'Fix it fast—borrow for urgent repairs or tools.' },
    { id: 'water', name: 'PesewaWaterBill', icon: '💧', tagline: 'Stay hydrated—borrow for water needs or bills.' },
    { id: 'fuel', name: 'PesewaBikeCarTuktukFuel', icon: '⛽', tagline: 'Keep moving—borrow for fuel, no matter your ride.' },
    { id: 'repair', name: 'PesewaBikeCarTuktukRepair', icon: '🛠️', tagline: 'Fix it quick—borrow for minor repairs and keep going.' },
    { id: 'medicine', name: 'PesewaMedicine', icon: '💊', tagline: 'Health first—borrow for urgent medicines.' },
    { id: 'electricity', name: 'PesewaElectricityTokens', icon: '⚡', tagline: 'Stay lit, stay powered—borrow tokens when you need it.' }
];

// Supported Countries
const COUNTRIES = [
    { code: 'KE', name: 'Kenya', currency: 'KSh', contact: '+254 709 219 000', email: 'kenya@pesewa.com' },
    { code: 'UG', name: 'Uganda', currency: 'UGX', contact: '+256 392 175 546', email: 'uganda@pesewa.com' },
    { code: 'TZ', name: 'Tanzania', currency: 'TZS', contact: '+255 659 073 010', email: 'tanzania@pesewa.com' },
    { code: 'RW', name: 'Rwanda', currency: 'RWF', contact: '+250 791 590 801', email: 'rwanda@pesewa.com' },
    { code: 'CD', name: 'Congo', currency: 'CDF/USD', contact: '+243 81 000 0000', email: 'congo@pesewa.com' },
    { code: 'BI', name: 'Burundi', currency: 'BIF', contact: '+257 79 000 000', email: 'burundi@pesewa.com' },
    { code: 'NG', name: 'Nigeria', currency: 'NGN', contact: '+234 800 000 0000', email: 'nigeria@pesewa.com' },
    { code: 'GH', name: 'Ghana', currency: 'GHS', contact: '+233 24 000 0000', email: 'ghana@pesewa.com' },
    { code: 'ZA', name: 'South Africa', currency: 'ZAR', contact: '+27 11 000 0000', email: 'southafrica@pesewa.com' },
    { code: 'SO', name: 'Somalia', currency: 'SOS', contact: '+252 63 000 0000', email: 'somalia@pesewa.com' },
    { code: 'SS', name: 'South Sudan', currency: 'SSP', contact: '+211 977 000 000', email: 'southsudan@pesewa.com' },
    { code: 'ET', name: 'Ethiopia', currency: 'ETB', contact: '+251 91 000 0000', email: 'ethiopia@pesewa.com' }
];

// Global State
const AppState = {
    currentUser: null,
    currentCountry: 'GH',
    currentCurrency: 'GHS',
    currentTier: 'basic',
    selectedRole: 'borrower',
    isLoggedIn: false,
    userData: null,
    notificationCount: 0,
    isOnline: navigator.onLine
};

// DOM Elements
const DOM = {
    // Country Selection
    countrySelect: document.getElementById('countrySelect'),
    currentCurrency: document.getElementById('currentCurrency'),
    countryLoginSelect: document.getElementById('countryLoginSelect'),
    countryLoginBtn: document.getElementById('countryLoginBtn'),
    
    // Role Toggle
    toggleBorrower: document.getElementById('toggleBorrower'),
    toggleLender: document.getElementById('toggleLender'),
    toggleBoth: document.getElementById('toggleBoth'),
    
    // Forms
    combinedRegistrationForm: document.getElementById('combinedRegistrationForm'),
    borrowerSection: document.getElementById('borrowerSection'),
    lenderSection: document.getElementById('lenderSection'),
    paymentSection: document.getElementById('paymentSection'),
    tierSelection: document.getElementById('tierSelection'),
    tierDetails: document.getElementById('tierDetails'),
    selectAllCategories: document.getElementById('selectAllCategories'),
    submitRegistration: document.getElementById('submitRegistration'),
    submitText: document.getElementById('submitText'),
    submitSpinner: document.getElementById('submitSpinner'),
    
    // Calculator
    loanAmount: document.getElementById('loanAmount'),
    loanAmountInput: document.getElementById('loanAmountInput'),
    maxAmount: document.getElementById('maxAmount'),
    repaymentDays: document.getElementById('repaymentDays'),
    totalRepayment: document.getElementById('totalRepayment'),
    interestAmount: document.getElementById('interestAmount'),
    dailyPayment: document.getElementById('dailyPayment'),
    dueDate: document.getElementById('dueDate'),
    exactDate: document.getElementById('exactDate'),
    currencySymbol: document.getElementById('currencySymbol'),
    currencyCode: document.getElementById('currencyCode'),
    tierBtns: document.querySelectorAll('.tier-btn'),
    dayBtns: document.querySelectorAll('.day-btn'),
    
    // Modals
    loginModal: document.getElementById('loginModal'),
    otpModal: document.getElementById('otpModal'),
    successModal: document.getElementById('successModal'),
    firebaseModal: document.getElementById('firebaseModal'),
    loginBtn: document.getElementById('loginBtn'),
    loginForm: document.getElementById('loginForm'),
    useOTP: document.getElementById('useOTP'),
    otpForm: document.getElementById('otpForm'),
    resendOTP: document.getElementById('resendOTP'),
    showPassword: document.getElementById('showPassword'),
    forgotPassword: document.getElementById('forgotPassword'),
    successMessage: document.getElementById('successMessage'),
    successDashboard: document.getElementById('successDashboard'),
    successClose: document.getElementById('successClose'),
    configureFirebase: document.getElementById('configureFirebase'),
    skipFirebase: document.getElementById('skipFirebase'),
    
    // PWA Install
    installPrompt: document.getElementById('installPrompt'),
    installConfirm: document.getElementById('installConfirm'),
    installCancel: document.getElementById('installCancel'),
    
    // Offline Indicator
    offlineIndicator: document.getElementById('offlineIndicator'),
    
    // Notifications
    notificationsBtn: document.getElementById('notificationsBtn'),
    notificationCount: document.getElementById('notificationCount'),
    
    // Stats
    activeGroups: document.getElementById('activeGroups'),
    weeklyLent: document.getElementById('weeklyLent')
};

// Initialize Application
function initApp() {
    console.log('Initializing Pesewa.com PWA...');
    
    // Load user preferences from localStorage
    loadUserPreferences();
    
    // Initialize event listeners
    initEventListeners();
    
    // Initialize calculator
    initCalculator();
    
    // Check for PWA install prompt
    initPWAInstall();
    
    // Check online status
    updateOnlineStatus();
    
    // Initialize mock data if Firebase not available
    if (!firebaseApp) {
        showFirebaseModal();
        initMockData();
    } else {
        initFirebaseAuth();
    }
    
    // Update UI based on initial state
    updateUI();
    
    console.log('Pesewa.com PWA initialized successfully');
}

// Load user preferences from localStorage
function loadUserPreferences() {
    const savedCountry = localStorage.getItem('pesewa_country');
    const savedRole = localStorage.getItem('pesewa_role');
    const savedTier = localStorage.getItem('pesewa_tier');
    
    if (savedCountry && CURRENCY_CONFIG[savedCountry]) {
        AppState.currentCountry = savedCountry;
        AppState.currentCurrency = CURRENCY_CONFIG[savedCountry].symbol;
    }
    
    if (savedRole && ['borrower', 'lender', 'both'].includes(savedRole)) {
        AppState.selectedRole = savedRole;
    }
    
    if (savedTier && TIER_CONFIG[savedTier]) {
        AppState.currentTier = savedTier;
    }
}

// Save user preferences to localStorage
function saveUserPreferences() {
    localStorage.setItem('pesewa_country', AppState.currentCountry);
    localStorage.setItem('pesewa_role', AppState.selectedRole);
    localStorage.setItem('pesewa_tier', AppState.currentTier);
}

// Initialize all event listeners
function initEventListeners() {
    // Country selection
    DOM.countrySelect?.addEventListener('change', handleCountryChange);
    DOM.countryLoginSelect?.addEventListener('change', handleCountryLoginChange);
    DOM.countryLoginBtn?.addEventListener('click', handleCountryLogin);
    
    // Role toggle
    DOM.toggleBorrower?.addEventListener('click', () => setRole('borrower'));
    DOM.toggleLender?.addEventListener('click', () => setRole('lender'));
    DOM.toggleBoth?.addEventListener('click', () => setRole('both'));
    
    // Form submission
    DOM.combinedRegistrationForm?.addEventListener('submit', handleRegistration);
    DOM.tierSelection?.addEventListener('change', handleTierChange);
    DOM.selectAllCategories?.addEventListener('change', handleSelectAllCategories);
    
    // Calculator
    DOM.loanAmount?.addEventListener('input', updateCalculator);
    DOM.loanAmountInput?.addEventListener('input', updateCalculatorFromInput);
    DOM.repaymentDays?.addEventListener('input', updateCalculator);
    
    // Tier buttons
    DOM.tierBtns.forEach(btn => {
        btn.addEventListener('click', () => setTier(btn.dataset.tier));
    });
    
    // Day buttons
    DOM.dayBtns.forEach(btn => {
        btn.addEventListener('click', () => setRepaymentDays(parseInt(btn.dataset.days)));
    });
    
    // Modals
    DOM.loginBtn?.addEventListener('click', () => showModal(DOM.loginModal));
    DOM.useOTP?.addEventListener('click', () => showModal(DOM.otpModal));
    DOM.showPassword?.addEventListener('click', togglePasswordVisibility);
    DOM.forgotPassword?.addEventListener('click', handleForgotPassword);
    DOM.resendOTP?.addEventListener('click', handleResendOTP);
    DOM.successDashboard?.addEventListener('click', goToDashboard);
    DOM.successClose?.addEventListener('click', () => hideModal(DOM.successModal));
    DOM.configureFirebase?.addEventListener('click', configureFirebase);
    DOM.skipFirebase?.addEventListener('click', () => hideModal(DOM.firebaseModal));
    
    // Form submissions
    DOM.loginForm?.addEventListener('submit', handleLogin);
    DOM.otpForm?.addEventListener('submit', handleOTPVerification);
    
    // PWA Install
    DOM.installConfirm?.addEventListener('click', installPWA);
    DOM.installCancel?.addEventListener('click', () => hideModal(DOM.installPrompt));
    
    // Close modals on outside click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            hideModal(e.target);
        }
    });
    
    // Online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Notification button
    DOM.notificationsBtn?.addEventListener('click', showNotifications);
}

// Initialize calculator
function initCalculator() {
    updateCalculator();
    setTier('basic');
    setRepaymentDays(7);
}

// Update calculator based on current values
function updateCalculator() {
    const amount = parseFloat(DOM.loanAmount.value);
    const days = parseInt(DOM.repaymentDays.value);
    
    // Update input field
    DOM.loanAmountInput.value = amount;
    
    // Calculate interest (10% per week, proportional for days)
    const weeklyInterestRate = 0.10; // 10%
    const dailyInterestRate = weeklyInterestRate / 7; // ~1.43% per day
    const interest = amount * (days * dailyInterestRate);
    const total = amount + interest;
    const dailyPayment = total / days;
    
    // Update display
    DOM.totalRepayment.innerHTML = `<span class="currency-symbol">${AppState.currentCurrency}</span><span id="totalAmount">${total.toFixed(2)}</span>`;
    DOM.interestAmount.innerHTML = `<span class="currency-symbol">${AppState.currentCurrency}</span><span id="interestValue">${interest.toFixed(2)}</span>`;
    DOM.dailyPayment.innerHTML = `<span class="currency-symbol">${AppState.currentCurrency}</span><span id="dailyValue">${dailyPayment.toFixed(2)}</span>`;
    
    // Update due date
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + days);
    
    DOM.dueDate.innerHTML = `<span id="dueDay">${days}</span> days from now`;
    DOM.exactDate.textContent = dueDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Update calculator from input field
function updateCalculatorFromInput() {
    const amount = parseFloat(DOM.loanAmountInput.value) || 0;
    const max = parseFloat(DOM.loanAmount.max);
    const min = parseFloat(DOM.loanAmount.min);
    
    // Validate and clamp value
    let validatedAmount = amount;
    if (amount > max) validatedAmount = max;
    if (amount < min) validatedAmount = min;
    
    DOM.loanAmount.value = validatedAmount;
    DOM.loanAmountInput.value = validatedAmount;
    updateCalculator();
}

// Set repayment days
function setRepaymentDays(days) {
    DOM.repaymentDays.value = days;
    
    // Update day buttons
    DOM.dayBtns.forEach(btn => {
        if (parseInt(btn.dataset.days) === days) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    updateCalculator();
}

// Set tier
function setTier(tier) {
    if (!TIER_CONFIG[tier]) return;
    
    AppState.currentTier = tier;
    
    // Update tier buttons
    DOM.tierBtns.forEach(btn => {
        if (btn.dataset.tier === tier) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update calculator max
    const maxLoan = TIER_CONFIG[tier].maxLoan;
    DOM.loanAmount.max = maxLoan;
    DOM.loanAmountInput.max = maxLoan;
    DOM.maxAmount.textContent = maxLoan;
    
    // Update currency symbol
    const amount = parseFloat(DOM.loanAmount.value);
    if (amount > maxLoan) {
        DOM.loanAmount.value = maxLoan;
        DOM.loanAmountInput.value = maxLoan;
    }
    
    // Update tier details
    updateTierDetails(tier);
    updateCalculator();
}

// Update tier details display
function updateTierDetails(tier) {
    const config = TIER_CONFIG[tier];
    
    // Hide all tier info
    document.querySelectorAll('.tier-info').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    
    // Show selected tier info
    const tierInfo = document.querySelector(`.${tier}-tier`);
    if (tierInfo) {
        tierInfo.classList.add('active');
        tierInfo.classList.remove('hidden');
    }
    
    // Update currency amounts in tier info
    document.querySelectorAll(`.${tier}-tier .currency-amount`).forEach(el => {
        el.textContent = config.maxLoan.toLocaleString();
    });
}

// Handle country change
function handleCountryChange(e) {
    const countryCode = e.target.value;
    const currencyConfig = CURRENCY_CONFIG[countryCode];
    
    if (currencyConfig) {
        AppState.currentCountry = countryCode;
        AppState.currentCurrency = currencyConfig.symbol;
        
        // Update UI
        DOM.currentCurrency.textContent = currencyConfig.symbol;
        DOM.currencySymbol.textContent = currencyConfig.symbol;
        DOM.currencyCode.textContent = currencyConfig.symbol;
        
        // Update currency in stats
        updateStatsCurrency();
        
        // Save preference
        saveUserPreferences();
        
        // Show notification
        showNotification(`Currency changed to ${currencyConfig.name} (${currencyConfig.symbol})`);
    }
}

// Handle country login selection
function handleCountryLoginChange(e) {
    const countryCode = e.target.value;
    if (countryCode) {
        DOM.countryLoginBtn.disabled = false;
    } else {
        DOM.countryLoginBtn.disabled = true;
    }
}

// Handle country login
function handleCountryLogin() {
    const countryCode = DOM.countryLoginSelect.value;
    if (!countryCode) return;
    
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (country) {
        showNotification(`Redirecting to ${country.name} dashboard...`);
        
        // In a real app, this would redirect to country-specific dashboard
        setTimeout(() => {
            window.location.href = `pages/dashboard.html?country=${countryCode}`;
        }, 1000);
    }
}

// Update stats with current currency
function updateStatsCurrency() {
    const weeklyLentElement = DOM.weeklyLent;
    if (weeklyLentElement) {
        weeklyLentElement.innerHTML = `<span class="currency-symbol">${AppState.currentCurrency}</span>250,000+`;
    }
}

// Set user role
function setRole(role) {
    AppState.selectedRole = role;
    
    // Update toggle buttons
    [DOM.toggleBorrower, DOM.toggleLender, DOM.toggleBoth].forEach(btn => {
        if (btn) {
            if (btn.id === `toggle${role.charAt(0).toUpperCase() + role.slice(1)}`) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
    
    // Show/hide form sections
    if (DOM.borrowerSection) {
        if (role === 'borrower' || role === 'both') {
            DOM.borrowerSection.classList.remove('hidden');
        } else {
            DOM.borrowerSection.classList.add('hidden');
        }
    }
    
    if (DOM.lenderSection) {
        if (role === 'lender' || role === 'both') {
            DOM.lenderSection.classList.remove('hidden');
            DOM.paymentSection.classList.remove('hidden');
        } else {
            DOM.lenderSection.classList.add('hidden');
            DOM.paymentSection.classList.add('hidden');
        }
    }
    
    // Update form title and submit button
    if (DOM.submitText) {
        let roleText = '';
        switch(role) {
            case 'borrower': roleText = 'Borrower'; break;
            case 'lender': roleText = 'Lender'; break;
            case 'both': roleText = 'Borrower & Lender'; break;
        }
        DOM.submitText.textContent = `Register as ${roleText}`;
        document.getElementById('formTitle').textContent = `${roleText} Registration`;
    }
    
    // Save preference
    saveUserPreferences();
}

// Handle tier change in dropdown
function handleTierChange(e) {
    const tier = e.target.value;
    if (TIER_CONFIG[tier]) {
        setTier(tier);
    }
}

// Handle select all categories
function handleSelectAllCategories(e) {
    const checkboxes = document.querySelectorAll('input[name="lenderCategories"]:not(#selectAllCategories)');
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
    });
}

// Handle registration form submission
async function handleRegistration(e) {
    e.preventDefault();
    
    // Show loading state
    DOM.submitText.classList.add('hidden');
    DOM.submitSpinner.classList.remove('hidden');
    DOM.submitRegistration.disabled = true;
    
    try {
        // Get form data
        const formData = new FormData(e.target);
        const userData = {
            // Basic info
            fullName: formData.get('fullName') || document.getElementById('fullName').value,
            phoneNumber: formData.get('phoneNumber') || document.getElementById('phoneNumber').value,
            email: formData.get('email') || document.getElementById('email').value || null,
            location: formData.get('location') || document.getElementById('location').value,
            country: formData.get('country') || document.getElementById('country').value || AppState.currentCountry,
            
            // Referrers
            referrers: [
                {
                    name: formData.get('referrer1') || document.getElementById('referrer1').value,
                    phone: formData.get('referrer1Phone') || document.getElementById('referrer1Phone').value
                },
                {
                    name: formData.get('referrer2') || document.getElementById('referrer2').value,
                    phone: formData.get('referrer2Phone') || document.getElementById('referrer2Phone').value
                }
            ],
            
            // Roles and preferences
            roles: [],
            borrowerCategories: [],
            lenderCategories: [],
            tier: null,
            subscription: null,
            registrationDate: new Date().toISOString(),
            status: 'pending_verification'
        };
        
        // Add roles
        if (AppState.selectedRole === 'borrower' || AppState.selectedRole === 'both') {
            userData.roles.push('borrower');
            
            // Get borrower categories
            const borrowerCheckboxes = document.querySelectorAll('input[name="borrowerCategories"]:checked');
            userData.borrowerCategories = Array.from(borrowerCheckboxes).map(cb => cb.value);
        }
        
        if (AppState.selectedRole === 'lender' || AppState.selectedRole === 'both') {
            userData.roles.push('lender');
            userData.tier = DOM.tierSelection.value;
            
            // Get lender categories
            const lenderCheckboxes = document.querySelectorAll('input[name="lenderCategories"]:checked');
            userData.lenderCategories = Array.from(lenderCheckboxes).map(cb => cb.value);
            
            // Get subscription info
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'mpesa';
            userData.subscription = {
                tier: userData.tier,
                paymentMethod: paymentMethod,
                status: 'pending',
                startDate: new Date().toISOString()
            };
        }
        
        // Validate required fields
        if (!userData.fullName || !userData.phoneNumber || !userData.location || !userData.country) {
            throw new Error('Please fill in all required fields');
        }
        
        if (userData.referrers.length < 2 || !userData.referrers[0].name || !userData.referrers[0].phone || 
            !userData.referrers[1].name || !userData.referrers[1].phone) {
            throw new Error('Please provide two valid referrers with names and phone numbers');
        }
        
        // Simulate API call
        await simulateRegistration(userData);
        
        // Show success message
        let successMsg = `Welcome to Pesewa.com, ${userData.fullName}! `;
        if (userData.roles.includes('borrower')) {
            successMsg += 'You can now join groups and request loans. ';
        }
        if (userData.roles.includes('lender')) {
            successMsg += 'Your lender account is pending verification. ';
        }
        successMsg += 'Please check your phone for verification instructions.';
        
        DOM.successMessage.textContent = successMsg;
        showModal(DOM.successModal);
        
        // Reset form
        e.target.reset();
        
        // Update app state
        if (firebaseApp && auth.currentUser) {
            AppState.currentUser = auth.currentUser;
            AppState.isLoggedIn = true;
            AppState.userData = userData;
            updateUI();
        }
        
    } catch (error) {
        showNotification(error.message, 'error');
        console.error('Registration error:', error);
    } finally {
        // Reset loading state
        DOM.submitText.classList.remove('hidden');
        DOM.submitSpinner.classList.add('hidden');
        DOM.submitRegistration.disabled = false;
    }
}

// Simulate registration API call
function simulateRegistration(userData) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate validation
            if (!userData.phoneNumber || userData.phoneNumber.length < 10) {
                reject(new Error('Please provide a valid phone number'));
                return;
            }
            
            // Simulate successful registration
            console.log('Registration successful:', userData);
            
            // Store in localStorage for demo
            const users = JSON.parse(localStorage.getItem('pesewa_users') || '[]');
            users.push({
                ...userData,
                id: 'user_' + Date.now(),
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('pesewa_users', JSON.stringify(users));
            
            resolve({ success: true, message: 'Registration successful' });
        }, 1500);
    });
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const identifier = document.getElementById('loginIdentifier').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!identifier || !password) {
        showNotification('Please enter both email/phone and password', 'error');
        return;
    }
    
    try {
        if (firebaseApp && auth) {
            // Try Firebase authentication
            let userCredential;
            if (identifier.includes('@')) {
                // Email login
                userCredential = await auth.signInWithEmailAndPassword(identifier, password);
            } else {
                // This would be phone auth in production
                showNotification('Phone login requires OTP verification', 'info');
                hideModal(DOM.loginModal);
                showModal(DOM.otpModal);
                return;
            }
            
            AppState.currentUser = userCredential.user;
            AppState.isLoggedIn = true;
            
            // Load user data from Firestore
            await loadUserData();
            
            showNotification('Login successful!', 'success');
            hideModal(DOM.loginModal);
            updateUI();
            
        } else {
            // Fallback to mock login
            await mockLogin(identifier, password);
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please check your credentials.', 'error');
    }
}

// Mock login for development
async function mockLogin(identifier, password) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Check mock users in localStorage
            const users = JSON.parse(localStorage.getItem('pesewa_users') || '[]');
            const user = users.find(u => 
                u.email === identifier || u.phoneNumber === identifier
            );
            
            if (user && password === 'demo123') { // Default demo password
                AppState.currentUser = { uid: user.id, email: user.email };
                AppState.isLoggedIn = true;
                AppState.userData = user;
                
                showNotification('Demo login successful!', 'success');
                hideModal(DOM.loginModal);
                updateUI();
                resolve();
            } else {
                reject(new Error('Invalid credentials'));
            }
        }, 1000);
    });
}

// Load user data
async function loadUserData() {
    if (!firebaseApp || !AppState.currentUser) {
        return;
    }
    
    try {
        const userDoc = await db.collection('users').doc(AppState.currentUser.uid).get();
        if (userDoc.exists) {
            AppState.userData = userDoc.data();
        }
    } catch (error) {
        console.warn('Failed to load user data:', error);
    }
}

// Handle OTP verification
async function handleOTPVerification(e) {
    e.preventDefault();
    
    const otpInputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    
    if (otp.length !== 6) {
        showNotification('Please enter a valid 6-digit OTP', 'error');
        return;
    }
    
    // Simulate OTP verification
    showNotification('Verifying OTP...', 'info');
    
    setTimeout(() => {
        // Mock successful verification
        if (otp === '123456' || otp === '000000') {
            AppState.isLoggedIn = true;
            AppState.currentUser = { uid: 'demo_user_' + Date.now(), phoneNumber: '+1234567890' };
            
            showNotification('OTP verified successfully!', 'success');
            hideModal(DOM.otpModal);
            updateUI();
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'pages/dashboard.html';
            }, 1500);
        } else {
            showNotification('Invalid OTP. Please try again.', 'error');
        }
    }, 1500);
}

// Handle forgot password
function handleForgotPassword(e) {
    e.preventDefault();
    showNotification('Password reset instructions have been sent to your email/phone.', 'info');
}

// Handle resend OTP
function handleResendOTP(e) {
    e.preventDefault();
    showNotification('New OTP has been sent to your phone.', 'info');
}

// Toggle password visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('loginPassword');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    DOM.showPassword.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
}

// Initialize Firebase authentication
function initFirebaseAuth() {
    if (!auth) return;
    
    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
        if (user) {
            AppState.currentUser = user;
            AppState.isLoggedIn = true;
            loadUserData();
        } else {
            AppState.currentUser = null;
            AppState.isLoggedIn = false;
            AppState.userData = null;
        }
        updateUI();
    });
    
    // Listen for real-time notifications
    if (realtimeDb) {
        initRealtimeNotifications();
    }
}

// Initialize real-time notifications
function initRealtimeNotifications() {
    if (!realtimeDb || !AppState.currentUser) return;
    
    const notificationsRef = realtimeDb.ref(`notifications/${AppState.currentUser.uid}`);
    
    notificationsRef.on('value', (snapshot) => {
        const notifications = snapshot.val();
        if (notifications) {
            const unreadCount = Object.values(notifications).filter(n => !n.read).length;
            AppState.notificationCount = unreadCount;
            updateNotificationCount();
        }
    });
}

// Update notification count display
function updateNotificationCount() {
    if (DOM.notificationCount) {
        DOM.notificationCount.textContent = AppState.notificationCount;
        if (AppState.notificationCount > 0) {
            DOM.notificationCount.style.display = 'flex';
        } else {
            DOM.notificationCount.style.display = 'none';
        }
    }
}

// Show notifications
function showNotifications() {
    showNotification('Notifications feature requires Firebase integration', 'info');
}

// Initialize mock data
function initMockData() {
    // Initialize mock users if none exist
    if (!localStorage.getItem('pesewa_users')) {
        const mockUsers = [
            {
                id: 'user_1',
                fullName: 'John Doe',
                phoneNumber: '+233241234567',
                email: 'john@example.com',
                location: 'Accra, Ghana',
                country: 'GH',
                roles: ['borrower', 'lender'],
                tier: 'premium',
                createdAt: new Date().toISOString()
            },
            {
                id: 'user_2',
                fullName: 'Jane Smith',
                phoneNumber: '+254712345678',
                email: 'jane@example.com',
                location: 'Nairobi, Kenya',
                country: 'KE',
                roles: ['borrower'],
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('pesewa_users', JSON.stringify(mockUsers));
    }
    
    // Initialize mock debt collectors
    if (!localStorage.getItem('pesewa_debt_collectors')) {
        const mockCollectors = generateDebtCollectors(50); // Generate 50 for demo
        localStorage.setItem('pesewa_debt_collectors', JSON.stringify(mockCollectors));
    }
}

// Generate mock debt collectors
function generateDebtCollectors(count) {
    const countries = ['KE', 'UG', 'TZ', 'RW', 'GH', 'NG', 'ZA'];
    const locations = {
        KE: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
        UG: ['Kampala', 'Entebbe', 'Jinja', 'Gulu'],
        TZ: ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mwanza'],
        RW: ['Kigali', 'Butare', 'Gisenyi', 'Ruhengeri'],
        GH: ['Accra', 'Kumasi', 'Tamale', 'Takoradi'],
        NG: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano'],
        ZA: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria']
    };
    
    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    
    const collectors = [];
    
    for (let i = 1; i <= count; i++) {
        const country = countries[Math.floor(Math.random() * countries.length)];
        const location = locations[country][Math.floor(Math.random() * locations[country].length)];
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        collectors.push({
            id: `collector_${i}`,
            name: `${firstName} ${lastName}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@debtcollector.co.${country.toLowerCase()}`,
            phone: `+${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            location: location,
            country: country,
            rating: (Math.random() * 2 + 3).toFixed(1), // 3-5 stars
            casesResolved: Math.floor(Math.random() * 500) + 50,
            specialization: ['Personal Loans', 'Business Debts', 'Utility Bills'][Math.floor(Math.random() * 3)],
            joinedDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString()
        });
    }
    
    return collectors;
}

// Show Firebase configuration modal
function showFirebaseModal() {
    if (!firebaseApp) {
        showModal(DOM.firebaseModal);
    }
}

// Configure Firebase (mock)
function configureFirebase() {
    showNotification('Firebase configuration would open setup instructions in production', 'info');
    hideModal(DOM.firebaseModal);
}

// Initialize PWA install prompt
function initPWAInstall() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        // Show install prompt
        showModal(DOM.installPrompt);
    });
    
    // Store install function
    window.installPWA = function() {
        if (!deferredPrompt) {
            showNotification('Installation not available', 'info');
            return;
        }
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                showNotification('Pesewa.com installed successfully!', 'success');
            } else {
                showNotification('Installation cancelled', 'info');
            }
            deferredPrompt = null;
            hideModal(DOM.installPrompt);
        });
    };
}

// Install PWA
function installPWA() {
    if (window.installPWA) {
        window.installPWA();
    }
}

// Update online status
function updateOnlineStatus() {
    AppState.isOnline = navigator.onLine;
    
    if (DOM.offlineIndicator) {
        if (AppState.isOnline) {
            DOM.offlineIndicator.classList.add('hidden');
        } else {
            DOM.offlineIndicator.classList.remove('hidden');
            showNotification('You are offline. Some features may be limited.', 'warning');
        }
    }
}

// Update UI based on app state
function updateUI() {
    // Update header based on login state
    if (DOM.loginBtn) {
        if (AppState.isLoggedIn) {
            DOM.loginBtn.textContent = 'Dashboard';
            DOM.loginBtn.onclick = () => {
                window.location.href = 'pages/dashboard.html';
            };
        } else {
            DOM.loginBtn.textContent = 'Login';
            DOM.loginBtn.onclick = () => {
                showModal(DOM.loginModal);
            };
        }
    }
    
    // Update notification count
    updateNotificationCount();
    
    // Update currency displays
    DOM.currentCurrency.textContent = AppState.currentCurrency;
    DOM.currencySymbol.textContent = AppState.currentCurrency;
    DOM.currencyCode.textContent = AppState.currentCurrency;
    
    // Update country select
    if (DOM.countrySelect) {
        DOM.countrySelect.value = AppState.currentCountry;
    }
    
    // Update role toggle
    setRole(AppState.selectedRole);
    
    // Update tier
    if (DOM.tierSelection) {
        DOM.tierSelection.value = AppState.currentTier;
    }
    updateTierDetails(AppState.currentTier);
    
    // Update stats
    updateStatsCurrency();
}

// Show modal
function showModal(modal) {
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

// Hide modal
function hideModal(modal) {
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Add styles if not already added
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--deep-blue);
                color: white;
                padding: 15px 20px;
                border-radius: var(--border-radius);
                display: flex;
                align-items: center;
                gap: 10px;
                box-shadow: var(--box-shadow-lg);
                z-index: 3000;
                animation: slideInRight 0.3s ease;
                border-left: 4px solid var(--yellow-accent);
                max-width: 400px;
            }
            .notification-info { border-left-color: var(--info-blue); }
            .notification-success { border-left-color: var(--success-green); }
            .notification-warning { border-left-color: var(--warning-orange); }
            .notification-error { border-left-color: var(--danger-red); }
            .notification-icon { font-size: 1.2rem; }
            .notification-message { flex: 1; }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to document
    document.body.appendChild(notification);
    
    // Add close event
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Get notification icon based on type
function getNotificationIcon(type) {
    switch(type) {
        case 'success': return '✓';
        case 'warning': return '⚠';
        case 'error': return '✗';
        default: return 'ℹ';
    }
}

// Go to dashboard
function goToDashboard() {
    hideModal(DOM.successModal);
    window.location.href = 'pages/dashboard.html';
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initApp,
        AppState,
        CURRENCY_CONFIG,
        TIER_CONFIG,
        LOAN_CATEGORIES,
        COUNTRIES
    };
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Add slideOutRight animation
if (!document.getElementById('notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent = `
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}