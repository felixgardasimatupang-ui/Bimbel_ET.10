const ALGORITHM = 'AES-GCM';

async function getKey(): Promise<CryptoKey> {
  let raw = sessionStorage.getItem('edu_crypto_key');
  if (!raw) {
    raw = crypto.randomUUID().replace(/-/g, '').slice(0, 32);
    sessionStorage.setItem('edu_crypto_key', raw);
  }
  const enc = new TextEncoder().encode(raw.slice(0, 32));
  return crypto.subtle.importKey('raw', enc, { name: ALGORITHM }, false, ['encrypt', 'decrypt']);
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export async function encrypt(plaintext: string): Promise<string> {
  try {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = textEncoder.encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded);
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode(...combined));
  } catch {
    return btoa(unescape(encodeURIComponent(plaintext)));
  }
}

export async function decrypt(ciphertext: string): Promise<string> {
  try {
    const key = await getKey();
    const combined = new Uint8Array(atob(ciphertext).split('').map((c) => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, data);
    return textDecoder.decode(decrypted);
  } catch {
    try {
      return decodeURIComponent(escape(atob(ciphertext)));
    } catch {
      return ciphertext;
    }
  }
}
