/**
 * Firebase Configuration File
 * Copy this file to your project and replace with your Firebase credentials
 */

// Production Configuration (Replace with your values)
const firebaseConfig = {
    // For development/testing, you can use these mock values
    // For production, get real values from Firebase Console
    
    // REQUIRED: Get from Firebase Console > Project Settings > General > Your apps
    apiKey: "AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R",
    
    // REQUIRED: Usually project-id.firebaseapp.com
    authDomain: "pesewa-production.firebaseapp.com",
    
    // REQUIRED: Your Firebase project ID
    projectId: "pesewa-production",
    
    // REQUIRED: Usually project-id.appspot.com
    storageBucket: "pesewa-production.appspot.com",
    
    // REQUIRED: Get from Firebase Console
    messagingSenderId: "123456789012",
    
    // REQUIRED: Get from Firebase Console
    appId: "1:123456789012:web:abc123def456ghi789jkl0",
    
    // OPTIONAL: For Google Analytics
    measurementId: "G-ABCDEFGHIJ"
};

// Development Configuration
const firebaseConfigDev = {
    apiKey: "AIzaSyDevKeyForDevelopmentOnly123",
    authDomain: "pesewa-dev.firebaseapp.com",
    projectId: "pesewa-dev",
    storageBucket: "pesewa-dev.appspot.com",
    messagingSenderId: "987654321098",
    appId: "1:987654321098:web:devappid1234567890",
    measurementId: "G-DEVMEASUREMENT"
};

// Test Configuration
const firebaseConfigTest = {
    apiKey: "AIzaSyTestKeyForTesting456",
    authDomain: "pesewa-test.firebaseapp.com",
    projectId: "pesewa-test",
    storageBucket: "pesewa-test.appspot.com",
    messagingSenderId: "111222333444",
    appId: "1:111222333444:web:testappid0987654321",
    measurementId: "G-TESTMEASUREMENT"
};

// Export based on environment
let configToUse;

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Using development Firebase configuration');
    configToUse = firebaseConfigDev;
} else if (window.location.hostname.includes('test') || window.location.hostname.includes('staging')) {
    console.log('Using test Firebase configuration');
    configToUse = firebaseConfigTest;
} else {
    console.log('Using production Firebase configuration');
    configToUse = firebaseConfig;
}

// Initialize Firebase
function initializeFirebase() {
    try {
        // Check if Firebase is already initialized
        if (firebase.apps.length === 0) {
            const app = firebase.initializeApp(configToUse);
            
            // Initialize services
            const auth = firebase.auth();
            const db = firebase.firestore();
            const storage = firebase.storage();
            const realtimeDb = firebase.database();
            
            // Enable Firestore offline persistence
            db.enablePersistence()
                .catch((err) => {
                    console.error('Firestore persistence error:', err);
                });
            
            console.log('Firebase initialized successfully');
            
            return {
                app,
                auth,
                db,
                storage,
                realtimeDb,
                analytics: firebase.analytics ? firebase.analytics() : null
            };
        } else {
            console.log('Firebase already initialized');
            return {
                app: firebase.app(),
                auth: firebase.auth(),
                db: firebase.firestore(),
                storage: firebase.storage(),
                realtimeDb: firebase.database(),
                analytics: firebase.analytics ? firebase.analytics() : null
            };
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return null;
    }
}

// Export configuration and initialization function
window.firebaseConfig = configToUse;
window.initializeFirebase = initializeFirebase;

// Auto-initialize if not in Node.js environment
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        // Initialize Firebase when DOM is ready
        const firebaseServices = initializeFirebase();
        
        if (firebaseServices) {
            // Store services globally
            window.firebaseServices = firebaseServices;
            
            // Set up auth state listener
            firebaseServices.auth.onAuthStateChanged((user) => {
                if (user) {
                    console.log('User is signed in:', user.uid);
                    // Dispatch custom event for auth state change
                    window.dispatchEvent(new CustomEvent('firebase-auth-state-changed', {
                        detail: { user, isAuthenticated: true }
                    }));
                } else {
                    console.log('User is signed out');
                    window.dispatchEvent(new CustomEvent('firebase-auth-state-changed', {
                        detail: { user: null, isAuthenticated: false }
                    }));
                }
            });
        }
    });
}