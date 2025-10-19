'use client';

import { AppProgressProvider as ProgressProvider } from '@bprogress/next';
import { ChatbotProvider } from '@/contexts/chatbot-context';

const Providers = ({ children }) => {
  return (
    <ProgressProvider
      height="3px"
      color="#000"
      options={{ showSpinner: false }}
      shallowRouting
    >
      <ChatbotProvider>{children}</ChatbotProvider>
    </ProgressProvider>
  );
};

export default Providers;
