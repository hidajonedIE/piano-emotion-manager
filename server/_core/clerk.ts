import { createClerkClient } from "@clerk/backend";
import { jwtDecode } from "jwt-decode";

console.log('[Clerk] CLERK_SECRET_KEY presente:', !!process.env.CLERK_SECRET_KEY);
console.log('[Clerk] CLERK_SECRET_KEY length:', process.env.CLERK_SECRET_KEY?.length || 0);

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function verifyClerkSession(req: {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  url?: string;
  method?: string;
}): Promise<{ user: any; debugLog: Record<string, string> } | null> {
  const debugLog: Record<string, string> = {};
  
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers?.["authorization"];
    debugLog.point1 = `Authorization header presente: ${!!authHeader}`;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      debugLog.point2 = "ERROR: No se encontró token en Authorization header";
      return null;
    }

    const token = authHeader.substring(7);
    debugLog.point2 = `Token extraído del header (primeros 50 caracteres): ${token.substring(0, 50)}...`;

    // Decode the token to get the user ID
    let decoded: any;
    try {
      decoded = jwtDecode(token);
      debugLog.point3 = "Token decodificado exitosamente";
    } catch (error) {
      debugLog.point3 = `ERROR al decodificar token: ${error instanceof Error ? error.message : String(error)}`;
      return null;
    }

    // Extract the user ID from the token
    const tokenUserId = decoded.sub;
    debugLog.point4 = `ID extraído del token (sub): ${tokenUserId}`;
    debugLog.point5 = `Email en token: ${decoded.email || "undefined"}`;
    debugLog.point6 = `Nombre en token: ${decoded.name || "undefined"}`;

    if (!tokenUserId) {
      debugLog.point7 = `ERROR: No se encontró 'sub' en el token. Claves disponibles: ${Object.keys(decoded).join(", ")}`;
      return null;
    }

    // Try to get user details from Clerk
    debugLog.point7 = `Intentando obtener usuario desde Clerk con ID: ${tokenUserId}`;
    
    let clerkUser: any = null;
    try {
      console.log('[Clerk] Intentando obtener usuario con ID:', tokenUserId);
      clerkUser = await clerkClient.users.getUser(tokenUserId);
      debugLog.point8 = `EXITO: Usuario encontrado en Clerk. Email: ${clerkUser.emailAddresses[0]?.emailAddress}`;
    } catch (clerkError) {
      const clerkErrorMessage = clerkError instanceof Error ? clerkError.message : String(clerkError);
      console.log('[Clerk] Error al obtener usuario:', clerkErrorMessage);
      console.log('[Clerk] ACTIVANDO FALLBACK: Usando datos del token como usuario');
      debugLog.point8 = `ERROR al obtener usuario desde Clerk: ${clerkErrorMessage}`;
      debugLog.point9 = `FALLBACK: Usando datos del token como usuario`;
      
      clerkUser = {
        id: tokenUserId,
        emailAddresses: [{ emailAddress: decoded.email }],
        firstName: decoded.name?.split(' ')[0] || "",
        lastName: decoded.name?.split(' ').slice(1).join(' ') || ""
      };
      console.log('[Clerk] FALLBACK clerkUser creado:', clerkUser);
    }
    
    // Return the user object
    const returnUser = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
      name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
      clerkId: clerkUser.id
    };
    
    debugLog.point9 = `USUARIO FINAL RETORNADO: ID=${returnUser.id}, Email=${returnUser.email}`;
    
    return { user: returnUser, debugLog };
  } catch (error) {
    debugLog.error = `ERROR GENERAL: ${error instanceof Error ? error.message : String(error)}`;
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
      .returning();

    debugLog.point13 = `Usuario creado exitosamente en BD: ID=${newUser.id}, Email=${newUser.email}`;
    return { user: newUser, debugLog };
  } catch (error) {
    debugLog.error = `ERROR en getOrCreateUserFromClerk: ${error instanceof Error ? error.message : String(error)}`;
    throw error;
  }
}
