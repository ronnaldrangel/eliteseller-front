'use client';

import { AppProgressProvider as ProgressProvider } from '@bprogress/next';

const Providers = ({ children }) => {
  return (
    <ProgressProvider
      height="3px"
      color="#000"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  );
};

export default Providers;
