import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.go.cirebon.timkerja.bidangsd',
  appName: 'Sistem Kerja Bidang SD',
  webDir: 'out',
  server: {
    url: process.env.CAP_SERVER_URL || 'https://tim-kerja.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
