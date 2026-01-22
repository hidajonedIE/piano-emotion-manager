import { createClerkClient } from "@clerk/backend";
import type { VercelRequest } from '@vercel/node';

console.log('[Clerk] CLERK_SECRET_KEY presente:', !!process.env.CLERK_SECRET_KEY);
console.log('[Clerk] CLERK_SECRET_KEY length:', process.env.CLERK_SECRET_KEY?.length || 0);
console.log('[Clerk] CLERK_PUBLISHABLE_KEY presente:', !!process.env.CLERK_PUBLISHABLE_KEY);

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
});

export async function verifyClerkSession(req: VercelRequest | {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  url?: string;
  method?: string;
}): Promise<{ user: any; debugLog: Record<string, string> } | null> {
  const debugLog: Record<string, string> = {};
  
  try {
    // Log all headers for debugging
    console.log('[Clerk] Request headers:', JSON.stringify(req.headers));
    
    // Get the token from the Authorization header (case-insensitive)
    const authHeader = (req.headers?.["authorization"] || req.headers?.["Authorization"]) as string | undefined;
    debugLog.point1 = `Authorization header presente: ${!!authHeader}`;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      debugLog.point2 = "ERROR: No se encontró token en Authorization header";
      console.log('[Clerk] No authorization header found');
      return null;
    }

    const token = authHeader.substring(7);
    debugLog.point2 = `Token extraído del header (primeros 50 caracteres): ${token.substring(0, 50)}...`;
    console.log('[Clerk] Token extracted, authenticating request...');

    // Use authenticateRequest instead of verifyToken
    // This automatically handles JWKS fetching and kid matching
    let authResult: any;
    try {
      // Create a minimal Request object that authenticateRequest expects
      // If req.url is relative, make it absolute
      let requestUrl = req.url || '/api/trpc';
      if (requestUrl.startsWith('/')) {
        requestUrl = `https://pianoemotion.com${requestUrl}`;
      }
      const requestObj = new Request(requestUrl, {
        method: req.method || 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      authResult = await clerkClient.authenticateRequest(requestObj, {
        authorizedParties: ['https://pianoemotion.com', 'http://localhost:3000'],
      });

      debugLog.point3 = `authenticateRequest result: isSignedIn=${authResult.isSignedIn}, isInterstitial=${authResult.isInterstitial}`;
      console.log('[Clerk] authenticateRequest completed:', { 
        isSignedIn: authResult.isSignedIn,
        isInterstitial: authResult.isInterstitial,
      });
    } catch (error) {
      debugLog.point3 = `ERROR al autenticar request con Clerk: ${error instanceof Error ? error.message : String(error)}`;
      console.error('[Clerk] authenticateRequest failed:', error);
      return null;
    }

    // Check if the request is authenticated
    if (!authResult.isSignedIn) {
      debugLog.point4 = "ERROR: Usuario no autenticado según authenticateRequest";
      console.error('[Clerk] User not signed in');
      return null;
    }

    // Get the user ID from the auth result
    const tokenUserId = authResult.toAuth().userId;
    debugLog.point4 = `ID extraído del auth result: ${tokenUserId}`;

    if (!tokenUserId) {
      debugLog.point5 = `ERROR: No se encontró userId en el auth result`;
      console.error('[Clerk] No userId found in auth result');
      return null;
    }

    // Try to get user details from Clerk
    debugLog.point5 = `Intentando obtener usuario desde Clerk con ID: ${tokenUserId}`;
    
    let clerkUser: any = null;
    try {
      console.log('[Clerk] Fetching user details from Clerk API...');
      clerkUser = await clerkClient.users.getUser(tokenUserId);
      debugLog.point6 = `EXITO: Usuario encontrado en Clerk. Email: ${clerkUser.emailAddresses[0]?.emailAddress}`;
      console.log('[Clerk] User fetched successfully from Clerk API');
    } catch (clerkError) {
      const clerkErrorMessage = clerkError instanceof Error ? clerkError.message : String(clerkError);
      console.error('[Clerk] Error fetching user from Clerk API:', clerkErrorMessage);
      debugLog.point6 = `ERROR al obtener usuario desde Clerk: ${clerkErrorMessage}`;
      debugLog.point7 = `FALLBACK: Usando datos del auth result como usuario`;
      
      // Use the auth result data as fallback
      const authData = authResult.toAuth();
      clerkUser = {
        id: tokenUserId,
        emailAddresses: [{ emailAddress: authData.sessionClaims?.email || '' }],
        firstName: authData.sessionClaims?.given_name || "",
        lastName: authData.sessionClaims?.family_name || ""
      };
      console.log('[Clerk] Using fallback user from auth result');
    }
    
    // Return the user object
    const returnUser = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
      name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
      clerkId: clerkUser.id
    };
    
    debugLog.point8 = `USUARIO FINAL RETORNADO: ID=${returnUser.id}, Email=${returnUser.email}`;
    console.log('[Clerk] Returning user:', { id: returnUser.id, email: returnUser.email });
    
    return { user: returnUser, debugLog };
  } catch (error) {
    debugLog.error = `ERROR GENERAL: ${error instanceof Error ? error.message : String(error)}`;
    console.error('[Clerk] General error in verifyClerkSession:', error);
    return null;
  }
}


export async function getOrCreateUserFromClerk(
  clerkUser: any,
  db: any,
  usersTable: any,
  eq: any,
  debugLog: Record<string, string> = {}
) {
  debugLog.point10 = `Buscando usuario en base de datos con openId (email): ${clerkUser.email}`;
  
  try {
    // Try to find existing user
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.openId, clerkUser.email))
      .limit(1);

    if (existingUser) {
      debugLog.point11 = `Usuario encontrado en BD: ID=${existingUser.id}, Email=${existingUser.email}`;
      return { user: existingUser, debugLog };
    }

    debugLog.point12 = "Usuario NO encontrado en BD, creando nuevo usuario";
    
    // Create new user
    await db
      .insert(usersTable)
      .values({
        openId: clerkUser.email,
        email: clerkUser.email,
        name: clerkUser.name,
        partnerId: 1, // Default to partner 1
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    // Fetch the newly created user
    const [newUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.openId, clerkUser.email))
      .limit(1);

    debugLog.point13 = `Usuario creado exitosamente en BD: ID=${newUser.id}, Email=${newUser.email}`;
    return { user: newUser, debugLog };
  } catch (error) {
    debugLog.error = `ERROR en getOrCreateUserFromClerk: ${error instanceof Error ? error.message : String(error)}`;
    throw error;
  }
}
