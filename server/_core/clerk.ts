import { clerkClient } from "@clerk/backend";
import { jwtDecode } from "jwt-decode";

export async function verifyClerkSession(req: {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  url?: string;
  method?: string;
}) {
  console.log("========== INICIANDO VERIFICACION DE SESION ==========");
  
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers?.["authorization"];
    console.log("[DEBUG] [Clerk] Authorization header presente:", !!authHeader);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[DEBUG] [Clerk] No se encontró token en Authorization header");
      return null;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    console.log("[DEBUG] [Clerk] Token extraído del header");

    // Decode the token to get the user ID
    let decoded: any;
    try {
      decoded = jwtDecode(token);
      console.log("[DEBUG] [Clerk] Token decodificado exitosamente");
    } catch (error) {
      console.error("[DEBUG] [Clerk] Error decodificando token:", error instanceof Error ? error.message : String(error));
      return null;
    }

    // Extract the user ID from the token
    const userId = decoded.sub;
    
    if (!userId) {
      console.error("[DEBUG] [Clerk] No se encontró 'sub' en el token");
      console.error("[DEBUG] [Clerk] Token keys:", Object.keys(decoded));
      return null;
    }
    
    console.log("[DEBUG] [Clerk] User ID extraído del token:", userId);

    // Try to get user details from Clerk
    try {
      console.log("[DEBUG] [Clerk] Intentando obtener usuario desde Clerk con ID:", userId);
      const user = await clerkClient.users.getUser(userId);
      
      console.log("[DEBUG] [Clerk] Usuario obtenido exitosamente desde Clerk");
      
      return {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        clerkId: user.id
      };
    } catch (clerkError) {
      console.error("[DEBUG] [Clerk] Error obteniendo usuario desde Clerk:", clerkError instanceof Error ? clerkError.message : String(clerkError));
      
      // Fallback: use the decoded token data
      console.log("[DEBUG] [Clerk] Usando fallback con datos del token");
      console.log("[DEBUG] [Clerk] Token data:", {
        email: decoded.email,
        name: decoded.name,
        sub: decoded.sub
      });
      
      return {
        id: userId,
        email: decoded.email || "",
        name: decoded.name || "",
        clerkId: userId
      };
    }
  } catch (error) {
    console.error("[DEBUG] [Clerk] ERROR VERIFICANDO SESION:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("[DEBUG] [Clerk] Stack trace:", error.stack);
    }
    return null;
  }
  finally {
    console.log("========== VERIFICACION DE SESION FINALIZADA ==========");
  }
}
