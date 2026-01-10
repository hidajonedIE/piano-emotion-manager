import { clerkClient } from "@clerk/nextjs/server";
import { jwtDecode } from "jwt-decode";

export async function verifyClerkSession(req: {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  url?: string;
  method?: string;
}) {
  console.log("\n\n=== INICIO VERIFICACION CLERK ===\n");
  
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers?.["authorization"];
    console.log("1. Authorization header presente:", !!authHeader);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("2. ERROR: No se encontró token en Authorization header");
      return null;
    }

    const token = authHeader.substring(7);
    console.log("2. Token extraído del header (primeros 50 caracteres):", token.substring(0, 50) + "...");

    // Decode the token to get the user ID
    let decoded: any;
    try {
      decoded = jwtDecode(token);
      console.log("3. Token decodificado exitosamente");
    } catch (error) {
      console.log("3. ERROR al decodificar token:", error instanceof Error ? error.message : String(error));
      return null;
    }

    // Extract the user ID from the token
    const tokenUserId = decoded.sub;
    console.log("4. ID extraído del token (sub):", tokenUserId);
    console.log("5. Email en token:", decoded.email);
    console.log("6. Nombre en token:", decoded.name);

    if (!tokenUserId) {
      console.log("7. ERROR: No se encontró 'sub' en el token");
      console.log("   Claves disponibles en token:", Object.keys(decoded).join(", "));
      return null;
    }

    // Try to get user details from Clerk
    console.log("7. Intentando obtener usuario desde Clerk con ID:", tokenUserId);
    
    let clerkUser: any = null;
    try {
      clerkUser = await clerkClient.users.getUser(tokenUserId);
      console.log("8. EXITO: Usuario encontrado en Clerk");
      console.log("   - ID en Clerk:", clerkUser.id);
      console.log("   - Email en Clerk:", clerkUser.emailAddresses[0]?.emailAddress);
      console.log("   - Nombre en Clerk:", `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim());
    } catch (clerkError) {
      const errorMessage = clerkError instanceof Error ? clerkError.message : String(clerkError);
      console.log("8. ERROR al obtener usuario desde Clerk:", errorMessage);
      console.log("   - ID que se intentó buscar:", tokenUserId);
      console.log("   - Tipo de error:", clerkError instanceof Error ? clerkError.constructor.name : typeof clerkError);
      
      // Fallback: use the decoded token data
      console.log("9. FALLBACK: Usando datos del token como usuario");
      console.log("   - ID (del token):", tokenUserId);
      console.log("   - Email (del token):", decoded.email);
      console.log("   - Nombre (del token):", decoded.name);
      
      clerkUser = {
        id: tokenUserId,
        emailAddresses: [{ emailAddress: decoded.email }],
        firstName: decoded.name?.split(' ')[0] || "",
        lastName: decoded.name?.split(' ').slice(1).join(' ') || ""
      };
    }
    
    // Return the user object
    return {
      id: clerkUser.id,
      email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
      name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
      clerkId: clerkUser.id
    };
  } catch (error) {
    console.log("ERROR GENERAL:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.log("Stack trace:", error.stack);
    }
    return null;
  }
  finally {
    console.log("\n=== FIN VERIFICACION CLERK ===\n");
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
