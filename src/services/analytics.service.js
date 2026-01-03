
import { signOut } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'http://localhost:3001';

async function fetchJson(endpoint, options = {}) {
    const res = await fetch(`${API_URL}/analytics/${endpoint}`, {
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

export const analyticsService = {
    getMonthlyRevenue: () => fetchJson('last-thirty-days-revenue'),
    getRevenueChart: (range) => fetchJson(`revenue-chart?range=${range}`),
    getPlanUsage: () => fetchJson('plans-usage'),
    getChurnMetrics: () => fetchJson('churn-metrics'),
    getLtvMetrics: () => fetchJson('ltv-metrics'),
    getUsers: (page = 1, limit = 10, status = 'all') => fetchJson(`users?page=${page}&limit=${limit}&status=${status}`),
};
