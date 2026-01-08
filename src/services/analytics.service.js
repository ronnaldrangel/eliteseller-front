import { signOut } from "next-auth/react";

const API_URL =
  process.env.NEXT_PUBLIC_ANALYTICS_API_URL ||
  "https://app-remarketing.s3cbwu.easypanel.host";

async function fetchJson(endpoint, options = {}, queryParams = {}, controllerName = "analytics") {
  const queryString = new URLSearchParams(queryParams).toString();
  const url = `${API_URL}/${controllerName}/${endpoint}${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      signOut({ callbackUrl: "/auth/login" });
    }
    throw new Error("Session expired");
  }

  if (!res.ok) {
    throw new Error(`Error fetching ${url}: ${res.statusText}`);
  }

  return res.json();
}

export const analyticsService = {
  getMonthlyRevenue: () => fetchJson("last-thirty-days-revenue"),
  getRevenueChart: (range) => fetchJson(`revenue-chart?range=${range}`),
  getPlanUsage: () => fetchJson("plans-usage"),
  getChurnMetrics: () => fetchJson("churn-metrics"),
  getLtvMetrics: () => fetchJson("ltv-metrics"),
  getUsers: (page = 1, limit = 10, status = "all") =>
    fetchJson(`users?page=${page}&limit=${limit}&status=${status}`),
  getSubscriptionsByPlan: (planId) => {
    return fetchJson(
      `subscriptions/${planId}`,
      {},
      {},
      "strapi"
    );
  },
  getUsersWithDetails: () => fetchJson('users', {}, {}, 'strapi'),
  getChatbots: () => fetchJson('chatbots', {}, {}, 'strapi'),
  getDashboardCounts: () => fetchJson('counts', {}, {}, 'strapi'),
};
