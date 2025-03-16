import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { Routes } from '@/routes';

function App() {
  return (
    <ThemeProvider defaultTheme="system" defaultColorScheme="ocean-breeze" storageKey="mailsyncai-theme">
      <Routes />
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

export default App;
