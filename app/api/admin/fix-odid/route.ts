/**
 * API endpoint para ejecutar el fix de odId
 * POST /api/admin/fix-odid
 */

import { getDb } from "@/server/db";
import { clients, pianos, services } from "@/drizzle/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Solo permitir en desarrollo
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Este endpoint solo está disponible en desarrollo" },
        { status: 403 }
      );
    }

    const db = await getDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    const correctOdId = "user_37Nq41VhiCgFUQ1dUPyH8fn25j6";

    console.log("🔍 Iniciando fix de odId...");

    // Actualizar clientes
    const clientsUpdateResult = await db
      .update(clients)
      .set({ odId: correctOdId })
      .execute();

    console.log(`✅ ${clientsUpdateResult.rowsAffected} clientes actualizados`);

    // Actualizar pianos
    const pianosUpdateResult = await db
      .update(pianos)
      .set({ odId: correctOdId })
      .execute();

    console.log(`✅ ${pianosUpdateResult.rowsAffected} pianos actualizados`);

    // Actualizar servicios
    const servicesUpdateResult = await db
      .update(services)
      .set({ odId: correctOdId })
      .execute();

    console.log(`✅ ${servicesUpdateResult.rowsAffected} servicios actualizados`);

    return NextResponse.json({
      success: true,
      message: "odId actualizado correctamente",
      results: {
        clientsUpdated: clientsUpdateResult.rowsAffected,
        pianosUpdated: pianosUpdateResult.rowsAffected,
        servicesUpdated: servicesUpdateResult.rowsAffected,
      },
    });
  } catch (error) {
    console.error("❌ Error en fix-odid:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
