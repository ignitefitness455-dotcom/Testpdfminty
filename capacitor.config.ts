import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pdfminty.app',
  appName: 'PDFMinty',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    appendUserAgent: 'PDFMintyApp/1.1.0',
    backgroundColor: '#ffffff',
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#6366f1',
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
