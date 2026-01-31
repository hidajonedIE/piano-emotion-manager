/**
 * Predictions Router - Análisis predictivo y forecasting
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { services, clients, pianos, invoices, inventory } from '../../drizzle/schema';
import { gte, lte, sql, and, eq } from 'drizzle-orm';
import { withCache } from '../cache';

export const forecastsRouter = router({
  /**
   * Predicción de ingresos para los próximos 3 meses
   * Basado en tendencias históricas y estacionalidad
   */
  predictRevenue: protectedProcedure.query(async () => {
    return withCache('forecasts:revenue', async () => {
      const db = await getDb();
    
    // Obtener ingresos de los últimos 12 meses
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const historicalRevenue = await db
      .select({
        month: sql<string>`DATE_FORMAT(${invoices.issueDate}, '%Y-%m')`,
        total: sql<number>`SUM(${invoices.totalAmount})`,
      })
      .from(invoices)
      .where(
        and(
          gte(invoices.issueDate, twelveMonthsAgo),
          sql`${invoices.status} != 'draft'`
        )
      )
      .groupBy(sql`DATE_FORMAT(${invoices.issueDate}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${invoices.issueDate}, '%Y-%m')`);

    // Calcular tendencia logarítmica (crecimiento que se desacelera)
    const revenues = historicalRevenue.map(r => r.total || 0);
    const avgRevenue = revenues.length > 0
      ? revenues.reduce((a, b) => a + b, 0) / revenues.length
      : 0;

    // Regresión logarítmica: y = a + b*ln(x)
    let logTrend = 0;
    if (revenues.length >= 2) {
      const n = revenues.length;
      let sumLogX = 0, sumY = 0, sumLogXY = 0, sumLogX2 = 0;
      
      for (let i = 0; i < n; i++) {
        const logX = Math.log(i + 1); // +1 para evitar log(0)
        sumLogX += logX;
        sumY += revenues[i];
        sumLogXY += logX * revenues[i];
        sumLogX2 += logX * logX;
      }
      
      // Calcular pendiente logarítmica
      const slope = (n * sumLogXY - sumLogX * sumY) / (n * sumLogX2 - sumLogX * sumLogX);
      logTrend = avgRevenue > 0 ? slope / avgRevenue : 0;
    }

    // Predecir próximos 3 meses
    const predictions = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(futureDate.getMonth() + i);
      
      // Aplicar tendencia logarítmica y estacionalidad
      const seasonalityFactor = 1 + (Math.sin((futureDate.getMonth() / 12) * 2 * Math.PI) * 0.1);
      const logFactor = Math.log(revenues.length + i);
      const predictedRevenue = avgRevenue * (1 + logTrend * logFactor) * seasonalityFactor;
      
      predictions.push({
        month: futureDate.toISOString().slice(0, 7),
        predicted: Math.round(predictedRevenue * 100) / 100,
        confidence: Math.max(60, 90 - (i * 10)), // Confianza decrece con el tiempo
      });
    }

    return {
      historical: historicalRevenue,
      predictions,
      avgMonthlyRevenue: Math.round(avgRevenue * 100) / 100,
      logTrend: Math.round(logTrend * 1000) / 1000,
    };
    }); // Cierre de withCache
  }),

  /**
   * Predicción de churn de clientes
   * Identifica clientes en riesgo de abandono
   */
  predictChurn: protectedProcedure.query(async () => {
    return withCache('forecasts:churn', async () => {
      const db = await getDb();
    
    // Obtener clientes con sus últimos servicios
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Clientes sin servicios en los últimos 3 meses
    const inactiveClients = await db
      .select({
        clientId: clients.id,
        clientName: clients.name,
        lastService: sql<Date>`MAX(${services.serviceDate})`,
        totalServices: sql<number>`COUNT(${services.id})`,
      })
      .from(clients)
      .leftJoin(services, eq(clients.id, services.clientId))
      .groupBy(clients.id, clients.name)
      .having(sql`MAX(${services.serviceDate}) < ${threeMonthsAgo} OR MAX(${services.serviceDate}) IS NULL`);

    // Calcular riesgo de churn
    const clientsAtRisk = inactiveClients.map(client => {
      const daysSinceLastService = client.lastService
        ? Math.floor((Date.now() - new Date(client.lastService).getTime()) / (1000 * 60 * 60 * 24))
        : 365;
      
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      let riskScore = 0;
      
      if (daysSinceLastService > 180) {
        riskLevel = 'high';
        riskScore = 85;
      } else if (daysSinceLastService > 90) {
        riskLevel = 'medium';
        riskScore = 60;
      } else {
        riskLevel = 'low';
        riskScore = 30;
      }

      return {
        clientId: client.clientId,
        clientName: client.clientName,
        daysSinceLastService,
        totalServices: client.totalServices || 0,
        riskLevel,
        riskScore,
      };
    });

    // Estadísticas generales
    const totalClients = await db.select({ count: sql<number>`COUNT(*)` }).from(clients);
    const atRiskCount = clientsAtRisk.filter(c => c.riskLevel !== 'low').length;
    const churnRate = totalClients[0].count > 0
      ? (atRiskCount / totalClients[0].count) * 100
      : 0;

    return {
      clientsAtRisk: clientsAtRisk.slice(0, 10), // Top 10 en riesgo
      totalAtRisk: atRiskCount,
      totalClients: totalClients[0].count,
      churnRate: Math.round(churnRate * 10) / 10,
    };
    }); // Cierre de withCache
  }),

  /**
   * Predicción de mantenimiento preventivo
   * Identifica pianos que requieren mantenimiento próximamente
   */
  predictMaintenance: protectedProcedure.query(async () => {
    return withCache('forecasts:maintenance', async () => {
      const db = await getDb();
    
    // Obtener pianos con sus últimos servicios
    const pianosWithServices = await db
      .select({
        pianoId: pianos.id,
        brand: pianos.brand,
        model: pianos.model,
        clientId: pianos.clientId,
        clientName: clients.name,
        lastService: sql<Date>`MAX(${services.serviceDate})`,
        serviceType: sql<string>`GROUP_CONCAT(DISTINCT ${services.serviceType})`,
      })
      .from(pianos)
      .leftJoin(clients, eq(pianos.clientId, clients.id))
      .leftJoin(services, eq(pianos.id, services.pianoId))
      .groupBy(pianos.id, pianos.brand, pianos.model, pianos.clientId, clients.name);

    // Calcular necesidad de mantenimiento
    const maintenancePredictions = pianosWithServices.map(piano => {
      const daysSinceLastService = piano.lastService
        ? Math.floor((Date.now() - new Date(piano.lastService).getTime()) / (1000 * 60 * 60 * 24))
        : 365;
      
      // Recomendación: afinación cada 6 meses, mantenimiento cada 12 meses
      let urgency: 'low' | 'medium' | 'high' = 'low';
      let daysUntilDue = 180 - daysSinceLastService;
      let recommendedAction = 'Afinación';
      
      if (daysSinceLastService > 365) {
        urgency = 'high';
        daysUntilDue = 0;
        recommendedAction = 'Mantenimiento completo';
      } else if (daysSinceLastService > 180) {
        urgency = 'medium';
        daysUntilDue = Math.max(0, 365 - daysSinceLastService);
        recommendedAction = 'Afinación y revisión';
      } else {
        urgency = 'low';
        daysUntilDue = 180 - daysSinceLastService;
        recommendedAction = 'Afinación';
      }

      return {
        pianoId: piano.pianoId,
        brand: piano.brand,
        model: piano.model,
        clientId: piano.clientId,
        clientName: piano.clientName,
        daysSinceLastService,
        daysUntilDue: Math.max(0, daysUntilDue),
        urgency,
        recommendedAction,
      };
    });

    // Ordenar por urgencia
    const sortedPredictions = maintenancePredictions.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency] || a.daysUntilDue - b.daysUntilDue;
    });

    return {
      predictions: sortedPredictions.slice(0, 15), // Top 15 más urgentes
      totalPianos: maintenancePredictions.length,
      highUrgency: maintenancePredictions.filter(p => p.urgency === 'high').length,
      mediumUrgency: maintenancePredictions.filter(p => p.urgency === 'medium').length,
    };
    }); // Cierre de withCache
  }),

  /**
   * Predicción de carga de trabajo
   * Estima la carga de trabajo para las próximas semanas
   */
  predictWorkload: protectedProcedure.query(async () => {
    return withCache('forecasts:workload', async () => {
      const db = await getDb();
    
    // Obtener servicios de las últimas 8 semanas
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    
    const historicalWorkload = await db
      .select({
        week: sql<string>`YEARWEEK(${services.serviceDate})`,
        count: sql<number>`COUNT(*)`,
        avgDuration: sql<number>`AVG(TIMESTAMPDIFF(HOUR, ${services.serviceDate}, ${services.serviceDate}))`,
      })
      .from(services)
      .where(gte(services.serviceDate, eightWeeksAgo))
      .groupBy(sql`YEARWEEK(${services.serviceDate})`)
      .orderBy(sql`YEARWEEK(${services.serviceDate})`);

    // Calcular promedio semanal
    const avgWeeklyServices = historicalWorkload.length > 0
      ? historicalWorkload.reduce((sum, w) => sum + (w.count || 0), 0) / historicalWorkload.length
      : 0;

    // Predecir próximas 4 semanas
    const predictions = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= 4; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setDate(futureDate.getDate() + (i * 7));
      
      // Aplicar estacionalidad semanal
      const dayOfWeek = futureDate.getDay();
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0;
      
      const predictedServices = Math.round(avgWeeklyServices * weekendFactor);
      const predictedHours = predictedServices * 2; // Estimación: 2 horas por servicio
      
      let workloadLevel: 'light' | 'normal' | 'heavy' = 'normal';
      if (predictedServices > avgWeeklyServices * 1.2) {
        workloadLevel = 'heavy';
      } else if (predictedServices < avgWeeklyServices * 0.8) {
        workloadLevel = 'light';
      }

      predictions.push({
        week: `Semana ${i}`,
        date: futureDate.toISOString().slice(0, 10),
        predictedServices,
        predictedHours,
        workloadLevel,
      });
    }

    return {
      historical: historicalWorkload,
      predictions,
      avgWeeklyServices: Math.round(avgWeeklyServices * 10) / 10,
    };
    }); // Cierre de withCache
  }),

  /**
   * Predicción de inventario
   * Identifica productos con stock bajo y estima necesidades de reposición
   */
  predictInventory: protectedProcedure.query(async () => {
    return withCache('forecasts:inventory', async () => {
      const db = await getDb();
    
    // Obtener inventario actual
    const inventoryItems = await db
      .select()
      .from(inventory)
      .orderBy(inventory.quantity);

    // Calcular uso promedio mensual basado en servicios
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentServices = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(services)
      .where(gte(services.serviceDate, threeMonthsAgo));

    const avgMonthlyServices = recentServices[0]?.count ? recentServices[0].count / 3 : 0;

    // Analizar cada item del inventario
    const predictions = inventoryItems.map(item => {
      // Estimación simple: cada servicio consume una cantidad proporcional
      const estimatedMonthlyUsage = avgMonthlyServices * 0.1; // 10% de servicios usan este item
      const monthsUntilEmpty = item.quantity > 0 ? item.quantity / estimatedMonthlyUsage : 0;
      
      let status: 'critical' | 'low' | 'adequate' | 'good' = 'good';
      let daysUntilEmpty = Math.round(monthsUntilEmpty * 30);
      
      if (monthsUntilEmpty < 0.5) {
        status = 'critical';
      } else if (monthsUntilEmpty < 1) {
        status = 'low';
      } else if (monthsUntilEmpty < 2) {
        status = 'adequate';
      } else {
        status = 'good';
      }

      return {
        itemId: item.id,
        name: item.name,
        category: item.category,
        currentStock: item.quantity,
        minStock: item.minStock,
        estimatedMonthlyUsage: Math.round(estimatedMonthlyUsage * 10) / 10,
        daysUntilEmpty,
        status,
        recommendedOrder: status === 'critical' || status === 'low' ? Math.ceil(estimatedMonthlyUsage * 2) : 0,
      };
    });

    // Ordenar por urgencia
    const sortedPredictions = predictions.sort((a, b) => {
      const statusOrder = { critical: 0, low: 1, adequate: 2, good: 3 };
      return statusOrder[a.status] - statusOrder[b.status] || a.daysUntilEmpty - b.daysUntilEmpty;
    });

    return {
      predictions: sortedPredictions,
      totalItems: inventoryItems.length,
      criticalItems: predictions.filter(p => p.status === 'critical').length,
      lowItems: predictions.filter(p => p.status === 'low').length,
      avgMonthlyServices: Math.round(avgMonthlyServices * 10) / 10,
    };
    }); // Cierre de withCache
  }),
});
