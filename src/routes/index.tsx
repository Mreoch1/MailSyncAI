import { BrowserRouter, Route, Routes as RouterRoutes } from 'react-router-dom';
import { AuthLayout } from '@/layouts/auth-layout';
import { DashboardLayout } from '@/layouts/dashboard-layout';
import { LandingPage } from '@/pages/landing';
import { SignInPage } from '@/pages/auth/sign-in';
import { SignUpPage } from '@/pages/auth/sign-up';
import { ProviderAuthPage } from '@/pages/auth/provider-auth';
import { DashboardPage } from '@/pages/dashboard';
import { SettingsPage } from '@/pages/settings';
import { SubscriptionPage } from '@/pages/subscription';
import { TermsPage } from '@/pages/legal/terms';
import { PrivacyPage } from '@/pages/legal/privacy';
import { SecurityPage } from '@/pages/legal/security';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export function Routes() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <RouterRoutes>
        <Route index element={<LandingPage />} />
        
        <Route element={<AuthLayout />}>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/auth/provider" element={<ProviderAuthPage />} />
        </Route>

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
        </Route>
        
        {/* Legal Pages */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/security" element={<SecurityPage />} />
      </RouterRoutes>
    </BrowserRouter>
  );
}