import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a9d746adc4264b16ac3c3fca9c9ab7c2',
  appName: 'whos-next-life',
  webDir: 'dist',
  server: {
    url: 'https://a9d746ad-c426-4b16-ac3c-3fca9c9ab7c2.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;