import crypto from 'crypto';

// Chaves VAPID padrão do projeto (podem ser sobrescritas por variáveis de ambiente VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY)
export const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BCNy8yL_dyk1D-lCduCPAv5pm70BM_XDjjEQx8clv8RfZrVedAmvXNOnqbvAhmhb6qWN_j2wBNRWNWX5Bmtf9PA';

export const DEFAULT_VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'wnplZzXfwltiuKRDMo8mhQCc6QD0lSRXHtOq9DT4NKA';

export const DEFAULT_VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:contato@louvorapp.com';

export interface PushSubscriptionData {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  eventId?: string;
  timestamp?: number;
}

function toBase64Url(buf: Buffer): string {
  return buf.toString('base64url');
}

function fromBase64Url(str: string): Buffer {
  return Buffer.from(str, 'base64url');
}

/**
 * Converte chave privada raw P-256 (32 bytes) + pública descomprimida (65 bytes)
 * em um objeto KeyObject compatível com crypto.sign('sha256') no formato JWK.
 */
function createVapidPrivateKeyObject(publicKeyB64: string, privateKeyB64: string): crypto.KeyObject {
  const pubBuf = fromBase64Url(publicKeyB64); // 65 bytes: 0x04 || X (32) || Y (32)
  const privBuf = fromBase64Url(privateKeyB64); // 32 bytes: D
  const x = toBase64Url(pubBuf.subarray(1, 33));
  const y = toBase64Url(pubBuf.subarray(33, 65));
  const d = toBase64Url(privBuf);

  return crypto.createPrivateKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      x,
      y,
      d
    },
    format: 'jwk'
  });
}

/**
 * Gera o cabeçalho Authorization VAPID (RFC 8292) assinado com ES256.
 */
export function createVapidAuthorizationHeader(
  endpoint: string,
  subject: string = DEFAULT_VAPID_SUBJECT,
  publicKey: string = DEFAULT_VAPID_PUBLIC_KEY,
  privateKey: string = DEFAULT_VAPID_PRIVATE_KEY
): string {
  const parsedUrl = new URL(endpoint);
  const audience = `${parsedUrl.protocol}//${parsedUrl.host}`;
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12h

  const header = toBase64Url(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payload = toBase64Url(
    Buffer.from(
      JSON.stringify({
        aud: audience,
        exp,
        sub: subject
      })
    )
  );

  const unsignedToken = `${header}.${payload}`;
  const keyObj = createVapidPrivateKeyObject(publicKey, privateKey);
  const signature = crypto.sign('sha256', Buffer.from(unsignedToken), {
    key: keyObj,
    dsaEncoding: 'ieee-p1363'
  });

  const jwt = `${unsignedToken}.${toBase64Url(signature)}`;
  return `vapid t=${jwt}, k=${publicKey}`;
}

/**
 * Criptografa o payload usando o padrão Web Push RFC 8291 (aes128gcm).
 */
export function encryptWebPushPayload(
  plaintext: string | Buffer,
  clientPublicKeyB64: string,
  clientAuthB64: string
): Buffer {
  const payloadBuf = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf-8') : plaintext;
  const uaPublic = fromBase64Url(clientPublicKeyB64);
  const authSecret = fromBase64Url(clientAuthB64);

  // 1. Par de chaves efêmero P-256 do servidor de envio (as_public, as_private)
  const asEcdh = crypto.createECDH('prime256v1');
  const asPublic = asEcdh.generateKeys();
  const sharedSecret = asEcdh.computeSecret(uaPublic);

  // 2. Salt aleatório de 16 bytes
  const salt = crypto.randomBytes(16);

  // 3. RFC 8291 Seção 3.3: Deriva IKM via HKDF-SHA256 usando auth_secret
  // key_info = "WebPush: info" || 0x00 || ua_public || as_public
  const keyInfo = Buffer.concat([
    Buffer.from('WebPush: info\0', 'ascii'),
    uaPublic,
    asPublic
  ]);
  const ikm = Buffer.from(crypto.hkdfSync('sha256', sharedSecret, authSecret, keyInfo, 32));

  // 4. Deriva CEK (16 bytes) e NONCE (12 bytes) a partir do IKM e do salt
  const cekInfo = Buffer.from('Content-Encoding: aes128gcm\0', 'ascii');
  const nonceInfo = Buffer.from('Content-Encoding: nonce\0', 'ascii');

  const cek = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, cekInfo, 16));
  const nonce = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, nonceInfo, 12));

  // 5. Adiciona o delimitador de registro final (0x02) ao payload e criptografa com AES-128-GCM
  const paddedPlaintext = Buffer.concat([payloadBuf, Buffer.from([2])]);
  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const encrypted = Buffer.concat([cipher.update(paddedPlaintext), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 16 bytes

  // 6. Monta o cabeçalho binário aes128gcm (RFC 8188):
  // salt (16) || rs (4 bytes uint32BE = 4096) || idlen (1 byte = 65) || keyid (as_public 65 bytes) || ciphertext || tag
  const rsBuf = Buffer.alloc(4);
  rsBuf.writeUInt32BE(4096, 0);
  const idLenBuf = Buffer.from([asPublic.length]);

  return Buffer.concat([salt, rsBuf, idLenBuf, asPublic, encrypted, authTag]);
}

/**
 * Envia uma notificação Web Push para uma assinatura de dispositivo (Android / iOS / Desktop).
 */
export async function sendWebPushNotification(
  subscription: PushSubscriptionData,
  payload: PushNotificationPayload
): Promise<{ ok: boolean; status: number; expired?: boolean; error?: string }> {
  try {
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return { ok: false, status: 400, error: 'Assinatura Push incompleta.' };
    }

    const bodyBuffer = encryptWebPushPayload(
      JSON.stringify(payload),
      subscription.keys.p256dh,
      subscription.keys.auth
    );

    const authHeader = createVapidAuthorizationHeader(subscription.endpoint);

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(bodyBuffer.length),
        'TTL': '86400',
        'Urgency': 'high'
      },
      body: new Uint8Array(bodyBuffer),
      signal: AbortSignal.timeout(8000)
    });

    if (response.status === 404 || response.status === 410) {
      return { ok: false, status: response.status, expired: true, error: 'Assinatura expirada ou removida.' };
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return {
        ok: false,
        status: response.status,
        error: `Push service respondeu HTTP ${response.status}: ${errText.slice(0, 150)}`
      };
    }

    return { ok: true, status: response.status };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      error: err?.message || 'Erro ao enviar Web Push.'
    };
  }
}
