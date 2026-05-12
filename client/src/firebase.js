import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser, not SSR)
let analytics = null;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

/**
 * Track a custom event in Firebase Analytics
 * @param {string} eventName - Event name (e.g. 'view_product')
 * @param {object} params - Additional parameters
 */
export const trackEvent = (eventName, params = {}) => {
    if (analytics) {
        logEvent(analytics, eventName, params);
    }
};

// Predefined event helpers for CampusOLX
export const Analytics = {
    viewProduct: (productId, productName, category) =>
        trackEvent('view_item', {
            item_id: productId,
            item_name: productName,
            item_category: category,
        }),

    startChat: (productId) =>
        trackEvent('begin_checkout', { product_id: productId }),

    login: () => trackEvent('login', { method: 'Google' }),

    signup: (branch, year) =>
        trackEvent('sign_up', { method: 'Google', branch, year }),

    createListing: (category, price) =>
        trackEvent('add_to_cart', { item_category: category, value: price }),

    search: (query, category) =>
        trackEvent('search', { search_term: query, category }),

    reportItem: () => trackEvent('report_item'),

    lostFoundReport: (type) => trackEvent('lost_found_report', { type }),
};

export { app, analytics };
export default app;
