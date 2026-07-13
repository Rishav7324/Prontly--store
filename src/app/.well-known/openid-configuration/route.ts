
import { NextResponse } from 'next/server';

/**
 * @fileOverview OIDC Discovery Metadata
 * Directs agents to Firebase Auth endpoints for authentication.
 */
export async function GET() {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'studio-2478374494-a2ee0';
  
  return NextResponse.json({
    issuer: `https://securetoken.google.com/${projectId}`,
    authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    token_endpoint: "https://oauth2.googleapis.com/token",
    userinfo_endpoint: "https://openidconnect.googleapis.com/v1/userinfo",
    jwks_uri: "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
    response_types_supported: ["id_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"]
  });
}
