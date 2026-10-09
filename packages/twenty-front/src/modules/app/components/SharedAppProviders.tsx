import { type PropsWithChildren } from 'react';

import { ApolloProvider } from '@/apollo/components/ApolloProvider';
import { PendingServerSignOutEffect } from '@/auth/effect-components/PendingServerSignOutEffect';
import { ClientConfigProvider } from '@/client-config/components/ClientConfigProvider';
import { ClientConfigProviderEffect } from '@/client-config/components/ClientConfigProviderEffect';
import { BaseThemeProvider } from '@/ui/theme/components/BaseThemeProvider';
import { SmbSkinEntry } from '@/smb-skin/components/SmbSkinEntry';

type SharedAppProvidersProps = PropsWithChildren;

export const SharedAppProviders = ({ children }: SharedAppProvidersProps) => {
  return (
    <ApolloProvider>
      <BaseThemeProvider>
        <ClientConfigProviderEffect />
        {/* P-013 (ADR-007): эффект скина. Должен идти ПЕРЕД snapshot'ом
            ThemeProvider, поэтому лежит ребёнком BaseThemeProvider здесь же. */}
        <SmbSkinEntry />
        <PendingServerSignOutEffect />
        <ClientConfigProvider>{children}</ClientConfigProvider>
      </BaseThemeProvider>
    </ApolloProvider>
  );
};
