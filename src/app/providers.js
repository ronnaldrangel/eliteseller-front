'use client';

import { AppProgressProvider as ProgressProvider } from '@bprogress/next';
import { ChatbotProvider } from '@/contexts/chatbot-context';
import { SWRConfig } from 'swr'
import { useSession } from 'next-auth/react'

const Providers = ({ children }) => {
  const { data: session } = useSession()

  const fetcher = async (url) => {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(session?.strapiToken ? { 'Authorization': `Bearer ${session.strapiToken}` } : {}),
      },
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const err = new Error(data?.error?.message || `Fetch failed with status ${res.status}`)
      err.data = data
      err.status = res.status
      throw err
    }
    return res.json()
  }

  return (
    <ProgressProvider
      height="3px"
      color="#000"
      options={{ showSpinner: false }}
      shallowRouting
    >
      <SWRConfig value={{ fetcher, revalidateOnFocus: false, dedupingInterval: 30000 }}>
        <ChatbotProvider>{children}</ChatbotProvider>
      </SWRConfig>
    </ProgressProvider>
  );
};

export default Providers;
