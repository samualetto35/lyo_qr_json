import Fingerprint2 from 'fingerprintjs2';

let cachedDeviceId: string | null = null;

export async function getDeviceFingerprint(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  // Check localStorage first
  const stored = localStorage.getItem('device_id');
  if (stored) {
    cachedDeviceId = stored;
    return stored;
  }

  // Generate new fingerprint
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve('unknown');
      return;
    }

    Fingerprint2.get((components) => {
      const values = components.map((component) => component.value);
      const murmur = Fingerprint2.x64hash128(values.join(''), 31);
      
      cachedDeviceId = murmur;
      localStorage.setItem('device_id', murmur);
      
      resolve(murmur);
    });
  });
}

