
import { signOut } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'http://localhost:3000';

async function fetchJson(endpoint, options = {}) {
    const res = await fetch(`${API_URL}/payments/${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (res.status === 401) {
        if (typeof window !== 'undefined') {
            signOut({ callbackUrl: '/auth/login' });
        }
        throw new Error('Session expired');
    }

    if (!res.ok) {
        throw new Error(`Error fetching ${endpoint}: ${res.statusText}`);
    }

    return res.json();
}

export const paymentsService = {
    getPayments: (start = 0, limit = 20, date) => {
        let qs = `list?start=${start}&limit=${limit}`;
        if (date) qs += `&date=${date}`;
        return fetchJson(qs);
    },
    getSubscriptions: (planId) => fetchJson(`subscriptions/${planId}`),
    getPlans: () => fetchJson('plans'),
    getCustomers: () => fetchJson('customers'),
    getInvoices: (customerId) => fetchJson(`customer/${customerId}/invoices`)
};
