import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.go.cirebon.timkerja.bidangsd',
  appName: 'Sistem Kerja Bidang SD',
  webDir: '.next',
  server: {
    url: process.env.CAP_SERVER_URL || 'http://localhost:3000',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
