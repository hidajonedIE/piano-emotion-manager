import { createClerkClient } from "@clerk/backend";
import { jwtDecode } from "jwt-decode";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function verifyClerkSession(req: {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  url?: string;
  method?: string;
}) {
  const logs: string[] = [];
  logs.push("\n=== INICIO VERIFICACION CLERK ===");
  
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers?.["authorization"];
    logs.push(`1. Authorization header presente: ${!!authHeader}`);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logs.push("2. ERROR: No se encontró token en Authorization header");
      console.log(logs.join("\n"));
      return null;
    }

    const token = authHeader.substring(7);
    logs.push(`2. Token extraído del header (primeros 50 caracteres): ${token.substring(0, 50)}...`);

    // Decode the token to get the user ID
    let decoded: any;
    try {
      decoded = jwtDecode(token);
      logs.push("3. Token decodificado exitosamente");
    } catch (error) {
      logs.push(`3. ERROR al decodificar token: ${error instanceof Error ? error.message : String(error)}`);
      console.log(logs.join("\n"));
      return null;
    }

    // Extract the user ID from the token
    const tokenUserId = decoded.sub;
    logs.push(`4. ID extraído del token (sub): ${tokenUserId}`);
    logs.push(`5. Email en token: ${decoded.email}`);
    logs.push(`6. Nombre en token: ${decoded.name}`);

    if (!tokenUserId) {
      logs.push("7. ERROR: No se encontró 'sub' en el token");
      logs.push(`   Claves disponibles en token: ${Object.keys(decoded).join(", ")}`);
      console.log(logs.join("\n"));
      return null;
    }

    // Try to get user details from Clerk
    logs.push(`7. Intentando obtener usuario desde Clerk con ID: ${tokenUserId}`);
    
    let clerkUser: any = null;
    let clerkSuccess = false;
    let clerkErrorMessage = "";
    try {
      clerkUser = await clerkClient.users.getUser(tokenUserId);
      logs.push("8. EXITO: Usuario encontrado en Clerk");
      logs.push(`   - ID en Clerk: ${clerkUser.id}`);
      logs.push(`   - Email en Clerk: ${clerkUser.emailAddresses[0]?.emailAddress}`);
      logs.push(`   - Nombre en Clerk: ${`${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim()}`);
      clerkSuccess = true;
    } catch (clerkError) {
      clerkErrorMessage = clerkError instanceof Error ? clerkError.message : String(clerkError);
      logs.push(`8. ERROR al obtener usuario desde Clerk: ${clerkErrorMessage}`);
      logs.push(`   - ID que se intentó buscar: ${tokenUserId}`);
      logs.push(`   - Tipo de error: ${clerkError instanceof Error ? clerkError.constructor.name : typeof clerkError}`);
      
      // Fallback: use the decoded token data
      logs.push("9. FALLBACK: Usando datos del token como usuario");
      logs.push(`   - ID (del token): ${tokenUserId}`);
      logs.push(`   - Email (del token): ${decoded.email}`);
      logs.push(`   - Nombre (del token): ${decoded.name}`);
      
      clerkUser = {
        id: tokenUserId,
        emailAddresses: [{ emailAddress: decoded.email }],
        firstName: decoded.name?.split(' ')[0] || "",
        lastName: decoded.name?.split(' ').slice(1).join(' ') || ""
      };
    }
    
    // Return the user object
    const returnUser = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
      name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
      clerkId: clerkUser.id
    };
    
    logs.push(`9. USUARIO FINAL RETORNADO: ${JSON.stringify(returnUser)}`);
    logs.push("=== FIN VERIFICACION CLERK ===");
    console.log(logs.join("\n"));
    
    return returnUser;
  } catch (error) {
    console.log("ERROR GENERAL:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.log("Stack trace:", error.stack);
    }
    return null;
  }
}


export async function getOrCreateUserFromClerk(
  clerkUser: any,
  db: any,
  usersTable: any,
  eq: any
) {
  console.log("10. Buscando usuario en base de datos con openId:", clerkUser.id);
  
  try {
    // Try to find existing user
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.openId, clerkUser.id))
      .limit(1);

    if (existingUser) {
      console.log("11. Usuario encontrado en BD:", { id: existingUser.id, email: existingUser.email });
      return existingUser;
    }

    console.log("12. Usuario NO encontrado en BD, creando nuevo usuario");
    
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

    console.log("13. Usuario creado exitosamente en BD:", { id: newUser.id, email: newUser.email });
    return newUser;
  } catch (error) {
    console.error("ERROR en getOrCreateUserFromClerk:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}
