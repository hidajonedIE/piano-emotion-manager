import { createClerkClient, verifyToken } from "@clerk/backend";
import type { VercelRequest } from '@vercel/node';

console.log('[Clerk] CLERK_SECRET_KEY presente:', !!process.env.CLERK_SECRET_KEY);
console.log('[Clerk] CLERK_SECRET_KEY length:', process.env.CLERK_SECRET_KEY?.length || 0);

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function verifyClerkSession(req: VercelRequest | {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  url?: string;
  method?: string;
}): Promise<{ user: any; debugLog: Record<string, string> } | null> {
  const debugLog: Record<string, string> = {};
  
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers?.["authorization"] as string | undefined;
    debugLog.point1 = `Authorization header presente: ${!!authHeader}`;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      debugLog.point2 = "ERROR: No se encontró token en Authorization header";
      console.log('[Clerk] No authorization header found');
      return null;
    }

    const token = authHeader.substring(7);
    debugLog.point2 = `Token extraído del header (primeros 50 caracteres): ${token.substring(0, 50)}...`;
    console.log('[Clerk] Token extracted, verifying...');

    // Verify the token using Clerk's verifyToken method
    let verifiedToken: any;
    try {
      verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      debugLog.point3 = "Token verificado exitosamente con Clerk";
      console.log('[Clerk] Token verified successfully:', { sub: verifiedToken.sub, sid: verifiedToken.sid });
    } catch (error) {
      debugLog.point3 = `ERROR al verificar token con Clerk: ${error instanceof Error ? error.message : String(error)}`;
      console.error('[Clerk] Token verification failed:', error);
      return null;
    }

    // Extract the user ID from the verified token
    const tokenUserId = verifiedToken.sub;
    debugLog.point4 = `ID extraído del token verificado (sub): ${tokenUserId}`;

    if (!tokenUserId) {
      debugLog.point5 = `ERROR: No se encontró 'sub' en el token verificado`;
      console.error('[Clerk] No sub found in verified token');
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
      debugLog.point7 = `FALLBACK: Usando datos del token verificado como usuario`;
      
      // Use the verified token data as fallback
      clerkUser = {
        id: tokenUserId,
        emailAddresses: [{ emailAddress: verifiedToken.email || '' }],
        firstName: verifiedToken.given_name || "",
        lastName: verifiedToken.family_name || ""
      };
      console.log('[Clerk] Using fallback user from verified token');
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
  debugLog.point10 = `Buscando usuario en base de datos con openId: ${clerkUser.id}`;
  
  try {
    // Try to find existing user
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.openId, clerkUser.id))
      .limit(1);

    if (existingUser) {
      debugLog.point11 = `Usuario encontrado en BD: ID=${existingUser.id}, Email=${existingUser.email}`;
      return { user: existingUser, debugLog };
    }

    debugLog.point12 = "Usuario NO encontrado en BD, creando nuevo usuario";
    
    // Create new user
    const [newUser] = await db
      .insert(usersTable)
      .values({
        openId: clerkUser.id,
        email: clerkUser.email,
        name: clerkUser.name,
        partnerId: 1, // Default to partner 1
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      ;

    debugLog.point13 = `Usuario creado exitosamente en BD: ID=${newUser.id}, Email=${newUser.email}`;
    return { user: newUser, debugLog };
  } catch (error) {
    debugLog.error = `ERROR en getOrCreateUserFromClerk: ${error instanceof Error ? error.message : String(error)}`;
    throw error;
  }
}
