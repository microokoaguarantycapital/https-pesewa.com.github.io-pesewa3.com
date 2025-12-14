/**
 * Pesewa.com - Main Application JavaScript
 * Complete, production-ready PWA with Firebase integration
 */

'use strict';

// ====================
// FIREBASE CONFIGURATION
// ====================
// REPLACE WITH YOUR FIREBASE PROJECT CONFIGURATION
// Get this from Firebase Console: Project Settings > General > Your apps
const firebaseConfig = {
    // YOUR CONFIGURATION HERE
    apiKey: "AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456ghi789jkl0",
    measurementId: "G-ABCDEFGHIJ"
};

// Alternative: Load from environment for production
// const firebaseConfig = {
//     apiKey: process.env.FIREBASE_API_KEY,
//     authDomain: process.env.FIREBASE_AUTH_DOMAIN,
//     projectId: process.env.FIREBASE_PROJECT_ID,
//     storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
//     appId: process.env.FIREBASE_APP_ID
// };

// Initialize Firebase
let firebaseApp, auth, db, realtimeDb, analytics;
try {
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully');
    } else {
        firebaseApp = firebase.app();
        console.log('Using existing Firebase app');
    }
    
    // Initialize services
    auth = firebase.auth();
    db = firebase.firestore();
    realtimeDb = firebase.database();
    
    // Enable Firestore offline persistence
    db.enablePersistence()
        .then(() => {
            console.log('Firestore offline persistence enabled');
        })
        .catch((err) => {
            console.warn('Firestore offline persistence failed:', err.code);
        });
    
    // Initialize Analytics if available
    if (firebase.analytics) {
        analytics = firebase.analytics();
        console.log('Firebase Analytics initialized');
    }
    
} catch (error) {
    console.error('Firebase initialization failed:', error);
    // Show configuration modal
    setTimeout(showFirebaseModal, 2000);
}

// ====================
// FIREBASE AUTHENTICATION FUNCTIONS
// ====================

/**
 * Register new user with email/password
 * @param {Object} userData - User registration data
 * @returns {Promise} Firebase user credential
 */
async function registerUser(userData) {
    try {
        // Create user with email/password
        const userCredential = await auth.createUserWithEmailAndPassword(
            userData.email || `${userData.phoneNumber}@pesewa.com`,
            generatePassword(userData.phoneNumber)
        );
        
        // Update user profile
        await userCredential.user.updateProfile({
            displayName: userData.fullName,
            phoneNumber: userData.phoneNumber
        });
        
        // Save additional user data to Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            uid: userCredential.user.uid,
            ...userData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        });
        
        // Log analytics event
        if (analytics) {
            analytics.logEvent('sign_up', {
                method: 'email',
                country: userData.country
            });
        }
        
        return userCredential;
        
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

/**
 * Login with email/password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} Firebase user credential
 */
async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        // Log analytics event
        if (analytics) {
            analytics.logEvent('login', { method: 'email' });
        }
        
        return userCredential;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise}
 */
async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        return { success: true, message: 'Password reset email sent' };
    } catch (error) {
        console.error('Password reset error:', error);
        throw error;
    }
}

/**
 * Sign out current user
 * @returns {Promise}
 */
async function signOutUser() {
    try {
        await auth.signOut();
        
        // Log analytics event
        if (analytics) {
            analytics.logEvent('logout');
        }
        
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
}

/**
 * Get current user data from Firestore
 * @returns {Promise<Object|null>} User data or null
 */
async function getCurrentUserData() {
    try {
        const user = auth.currentUser;
        if (!user) return null;
        
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error('Get user data error:', error);
        return null;
    }
}

/**
 * Update user profile
 * @param {Object} updates - Profile updates
 * @returns {Promise}
 */
async function updateUserProfile(updates) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');
        
        await db.collection('users').doc(user.uid).update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return { success: true };
    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
}

// ====================
// FIRESTORE OPERATIONS
// ====================

/**
 * Create a new group
 * @param {Object} groupData - Group data
 * @returns {Promise} Group document reference
 */
async function createGroup(groupData) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Authentication required');
        
        const groupRef = db.collection('groups').doc();
        await groupRef.set({
            id: groupRef.id,
            ...groupData,
            createdBy: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            members: [user.uid],
            memberCount: 1,
            status: 'active'
        });
        
        // Add user to group members subcollection
        await groupRef.collection('members').doc(user.uid).set({
            userId: user.uid,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
            role: 'admin',
            status: 'active'
        });
        
        // Update user's groups
        await db.collection('users').doc(user.uid).update({
            groups: firebase.firestore.FieldValue.arrayUnion(groupRef.id)
        });
        
        return groupRef;
    } catch (error) {
        console.error('Create group error:', error);
        throw error;
    }
}

/**
 * Create a new loan request
 * @param {Object} loanData - Loan data
 * @returns {Promise} Loan document reference
 */
async function createLoanRequest(loanData) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Authentication required');
        
        const loanRef = db.collection('loans').doc();
        await loanRef.set({
            id: loanRef.id,
            ...loanData,
            borrowerId: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
            disbursementTime: null,
            repaymentDueDate: calculateDueDate(7), // 7 days from now
            interestRate: 0.10, // 10%
            totalRepayment: calculateTotalRepayment(loanData.amount, 0.10)
        });
        
        // Send notification to lenders in the group
        await notifyGroupLenders(loanData.groupId, loanRef.id);
        
        return loanRef;
    } catch (error) {
        console.error('Create loan error:', error);
        throw error;
    }
}

/**
 * Create or update ledger entry
 * @param {Object} ledgerData - Ledger data
 * @returns {Promise}
 */
async function updateLedger(ledgerData) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Authentication required');
        
        const ledgerRef = db.collection('ledgers').doc(ledgerData.id || db.collection('ledgers').doc().id);
        await ledgerRef.set({
            id: ledgerRef.id,
            ...ledgerData,
            lenderId: user.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastUpdatedBy: user.uid
        }, { merge: true });
        
        return ledgerRef;
    } catch (error) {
        console.error('Update ledger error:', error);
        throw error;
    }
}

// ====================
// REAL-TIME DATABASE
// ====================

/**
 * Subscribe to real-time notifications
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function for new notifications
 */
function subscribeToNotifications(userId, callback) {
    if (!realtimeDb) {
        console.warn('Realtime Database not available');
        return null;
    }
    
    const notificationsRef = realtimeDb.ref(`notifications/${userId}`);
    
    // Listen for new notifications
    notificationsRef.on('child_added', (snapshot) => {
        const notification = snapshot.val();
        callback(notification);
        
        // Mark as read after 5 seconds
        setTimeout(() => {
            snapshot.ref.update({ read: true });
        }, 5000);
    });
    
    return notificationsRef;
}

/**
 * Send notification to user
 * @param {string} userId - Recipient user ID
 * @param {Object} notification - Notification data
 */
async function sendNotification(userId, notification) {
    if (!realtimeDb) {
        console.warn('Realtime Database not available');
        return;
    }
    
    const notificationsRef = realtimeDb.ref(`notifications/${userId}`).push();
    await notificationsRef.set({
        ...notification,
        id: notificationsRef.key,
        timestamp: Date.now(),
        read: false
    });
}

// ====================
// HELPER FUNCTIONS
// ====================

/**
 * Generate password from phone number
 * @param {string} phoneNumber - User phone number
 * @returns {string} Generated password
 */
function generatePassword(phoneNumber) {
    // Use last 6 digits of phone number + Pesewa2024!
    const lastSixDigits = phoneNumber.replace(/\D/g, '').slice(-6);
    return `Pesewa${lastSixDigits}!`;
}

/**
 * Calculate due date
 * @param {number} days - Number of days from now
 * @returns {Date} Due date
 */
function calculateDueDate(days) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate;
}

/**
 * Calculate total repayment with interest
 * @param {number} amount - Loan amount
 * @param {number} interestRate - Interest rate (0.10 for 10%)
 * @returns {number} Total repayment amount
 */
function calculateTotalRepayment(amount, interestRate) {
    return amount + (amount * interestRate);
}

/**
 * Notify lenders in a group about new loan request
 * @param {string} groupId - Group ID
 * @param {string} loanId - Loan ID
 */
async function notifyGroupLenders(groupId, loanId) {
    try {
        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) return;
        
        const groupData = groupDoc.data();
        const lenders = await getGroupLenders(groupId);
        
        for (const lender of lenders) {
            await sendNotification(lender.userId, {
                type: 'new_loan_request',
                title: 'New Loan Request',
                message: `New loan request in ${groupData.name}`,
                loanId: loanId,
                groupId: groupId
            });
        }
    } catch (error) {
        console.error('Notify lenders error:', error);
    }
}

/**
 * Get lenders in a group
 * @param {string} groupId - Group ID
 * @returns {Promise<Array>} List of lenders
 */
async function getGroupLenders(groupId) {
    try {
        const membersSnapshot = await db.collection('groups').doc(groupId).collection('members').get();
        const members = [];
        
        for (const doc of membersSnapshot.docs) {
            const userDoc = await db.collection('users').doc(doc.id).get();
            if (userDoc.exists && userDoc.data().roles?.includes('lender')) {
                members.push({
                    userId: doc.id,
                    ...userDoc.data()
                });
            }
        }
        
        return members;
    } catch (error) {
        console.error('Get group lenders error:', error);
        return [];
    }
}

// ====================
// FIREBASE SETUP MODAL
// ====================

/**
 * Show Firebase configuration modal
 */
function showFirebaseModal() {
    const modal = document.getElementById('firebaseModal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // Update code block with actual config
        const codeBlock = modal.querySelector('code');
        if (codeBlock) {
            codeBlock.textContent = `const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};`;
        }
    }
}

/**
 * Configure Firebase with user input
 */
async function configureFirebase() {
    const modal = document.getElementById('firebaseModal');
    const apiKey = prompt('Enter Firebase API Key:');
    if (!apiKey) return;
    
    const authDomain = prompt('Enter Firebase Auth Domain:');
    const projectId = prompt('Enter Firebase Project ID:');
    const storageBucket = prompt('Enter Firebase Storage Bucket:');
    const messagingSenderId = prompt('Enter Firebase Messaging Sender ID:');
    const appId = prompt('Enter Firebase App ID:');
    
    // Update firebaseConfig
    firebaseConfig.apiKey = apiKey;
    firebaseConfig.authDomain = authDomain;
    firebaseConfig.projectId = projectId;
    firebaseConfig.storageBucket = storageBucket;
    firebaseConfig.messagingSenderId = messagingSenderId;
    firebaseConfig.appId = appId;
    
    try {
        // Reinitialize Firebase
        firebaseApp = firebase.initializeApp(firebaseConfig, 'pesewa');
        auth = firebase.auth();
        db = firebase.firestore();
        realtimeDb = firebase.database();
        
        showNotification('Firebase configured successfully!', 'success');
        hideModal(modal);
        
        // Save to localStorage
        localStorage.setItem('firebaseConfig', JSON.stringify(firebaseConfig));
        
    } catch (error) {
        console.error('Firebase configuration error:', error);
        showNotification('Failed to configure Firebase. Please check your credentials.', 'error');
    }
}

// Load saved Firebase config from localStorage
function loadFirebaseConfig() {
    const savedConfig = localStorage.getItem('firebaseConfig');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            Object.assign(firebaseConfig, config);
            console.log('Loaded Firebase config from localStorage');
        } catch (error) {
            console.error('Failed to load Firebase config:', error);
        }
    }
}

// ====================
// INITIALIZATION
// ====================

// Load Firebase config on startup
loadFirebaseConfig();

// Export Firebase functions for use in other modules
window.firebaseServices = {
    // Configuration
    firebaseConfig,
    isFirebaseInitialized: !!firebaseApp,
    
    // Auth functions
    registerUser,
    loginUser,
    resetPassword,
    signOutUser,
    getCurrentUserData,
    updateUserProfile,
    
    // Firestore functions
    createGroup,
    createLoanRequest,
    updateLedger,
    
    // Realtime functions
    subscribeToNotifications,
    sendNotification,
    
    // Utility functions
    calculateTotalRepayment,
    calculateDueDate
};

// The rest of the app.js file continues with the existing code...
// [Previous app.js code continues here]
