// ============================================================================
// GEE CLIENT - Google Earth Engine REST API Client
// ============================================================================

import { create as createJWT } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

export interface GEEClientConfig {
  serviceAccountEmail: string;
  privateKey: string;
}

export class GEEClient {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private readonly baseURL = "https://earthengine.googleapis.com/v1";
  
  constructor(private config: GEEClientConfig) {}

  async authenticate(): Promise<void> {
    // Verificar si el token actual es válido
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600; // 1 hora

    // Crear JWT header y payload
    const header = { alg: "RS256" as const, typ: "JWT" };
    const payload = {
      iss: this.config.serviceAccountEmail,
      scope: "https://www.googleapis.com/auth/earthengine.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: expiry,
    };

    // Importar clave privada
    const keyData = this.config.privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\\n/g, "")
      .replace(/\n/g, "")
      .trim();
    
    const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      keyBuffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const jwt = await createJWT(header, payload, cryptoKey);

    // Intercambiar JWT por Access Token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to authenticate with GEE: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    this.accessToken = tokenData.access_token;
    this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000; // 1 min buffer
  }

  async computeValue(expression: unknown): Promise<unknown> {
    await this.authenticate();

    const response = await fetch(`${this.baseURL}:computeValue`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expression }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GEE API Error: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }
}
