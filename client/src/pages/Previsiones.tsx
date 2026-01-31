/**
 * Previsiones Page - Análisis de Previsiones y Forecasting
 * Piano Emotion Manager
 */

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, Users, Wrench, Calendar, Clock, Package } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export default function Previsiones() {
  const { t } = useTranslation();
  
  const { data: revenueData, isLoading: loadingRevenue } = trpc.forecasts.predictRevenue.useQuery();
  const { data: churnData, isLoading: loadingChurn } = trpc.forecasts.predictChurn.useQuery();
  const { data: maintenanceData, isLoading: loadingMaintenance } = trpc.forecasts.predictMaintenance.useQuery();
  const { data: workloadData, isLoading: loadingWorkload } = trpc.forecasts.predictWorkload.useQuery();
  const { data: inventoryData, isLoading: loadingInventory } = trpc.forecasts.predictInventory.useQuery();

  const isLoading = loadingRevenue || loadingChurn || loadingMaintenance || loadingWorkload || loadingInventory;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Calculando previsiones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Previsiones</h1>
        <p className="text-muted-foreground">
          Análisis de previsiones basado en tendencias históricas y algoritmos de forecasting
        </p>
      </div>

      {/* Predicción de Ingresos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle>Previsión de Ingresos</CardTitle>
              <CardDescription>Proyección para los próximos 3 meses</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Métricas Clave */}
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Ingreso Mensual Promedio</p>
                <p className="text-2xl font-bold">€{revenueData?.avgMonthlyRevenue.toFixed(2) || '0.00'}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Tendencia Logarítmica</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{revenueData?.logTrend?.toFixed(3) || '0.000'}</p>
                  {revenueData && revenueData.logTrend > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Predicciones */}
            <div className="space-y-3">
              <h4 className="font-semibold">Proyecciones Mensuales</h4>
              {revenueData?.predictions.map((pred, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{pred.month}</span>
                    <span className="text-sm text-muted-foreground">{pred.confidence}% confianza</span>
                  </div>
                  <p className="text-xl font-bold text-green-600">€{pred.predicted.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predicción de Churn */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle>Previsión de Churn</CardTitle>
              <CardDescription>Clientes en riesgo de abandono</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Métricas */}
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Tasa de Churn</p>
                <p className="text-2xl font-bold text-orange-600">{churnData?.churnRate.toFixed(1) || '0.0'}%</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Clientes en Riesgo</p>
                <p className="text-2xl font-bold">{churnData?.totalAtRisk || 0} / {churnData?.totalClients || 0}</p>
              </div>
            </div>

            {/* Top Clientes en Riesgo */}
            <div className="space-y-3">
              <h4 className="font-semibold">Top Clientes en Riesgo</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {churnData?.clientsAtRisk.slice(0, 5).map((client) => (
                  <div key={client.clientId} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{client.clientName}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        client.riskLevel === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                        client.riskLevel === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {client.riskLevel === 'high' ? 'Alto' : client.riskLevel === 'medium' ? 'Medio' : 'Bajo'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {client.daysSinceLastService} días sin servicio • {client.totalServices} servicios totales
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predicción de Mantenimiento */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>Mantenimiento Preventivo</CardTitle>
              <CardDescription>Pianos que requieren atención próximamente</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Métricas */}
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Urgencia Alta</p>
                <p className="text-2xl font-bold text-red-600">{maintenanceData?.highUrgency || 0}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Urgencia Media</p>
                <p className="text-2xl font-bold text-orange-600">{maintenanceData?.mediumUrgency || 0}</p>
              </div>
            </div>

            {/* Top Pianos Urgentes */}
            <div className="space-y-3">
              <h4 className="font-semibold">Pianos Más Urgentes</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {maintenanceData?.predictions.slice(0, 5).map((piano) => (
                  <div key={piano.pianoId} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{piano.brand} {piano.model}</p>
                        <p className="text-sm text-muted-foreground">{piano.clientName}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        piano.urgency === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                        piano.urgency === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                        'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {piano.urgency === 'high' ? 'Urgente' : piano.urgency === 'medium' ? 'Pronto' : 'Normal'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-blue-600">{piano.recommendedAction}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {piano.daysUntilDue === 0 ? 'Vencido' : `${piano.daysUntilDue} días restantes`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predicción de Carga de Trabajo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle>Previsión de Carga de Trabajo</CardTitle>
              <CardDescription>Estimación para las próximas 4 semanas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Métrica Promedio */}
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Promedio Semanal</p>
                <p className="text-2xl font-bold">{workloadData?.avgWeeklyServices.toFixed(1) || '0.0'} servicios</p>
              </div>
            </div>

            {/* Predicciones Semanales */}
            <div className="space-y-3">
              <h4 className="font-semibold">Proyección Semanal</h4>
              {workloadData?.predictions.map((pred, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{pred.week}</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      pred.workloadLevel === 'heavy' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                      pred.workloadLevel === 'normal' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    }`}>
                      {pred.workloadLevel === 'heavy' ? 'Alta' : pred.workloadLevel === 'normal' ? 'Normal' : 'Ligera'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Wrench className="w-4 h-4" />
                      <span>{pred.predictedServices} servicios</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{pred.predictedHours}h estimadas</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Previsión de Inventario */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle>Previsión de Inventario</CardTitle>
              <CardDescription>Productos que requieren reposición</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Métricas */}
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Items Críticos</p>
                <p className="text-2xl font-bold text-red-600">{inventoryData?.criticalItems || 0}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Stock Bajo</p>
                <p className="text-2xl font-bold text-orange-600">{inventoryData?.lowItems || 0}</p>
              </div>
            </div>

            {/* Top Items Urgentes */}
            <div className="space-y-3">
              <h4 className="font-semibold">Items Más Urgentes</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {inventoryData?.predictions.slice(0, 5).map((item) => (
                  <div key={item.itemId} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.status === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                        item.status === 'low' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                        item.status === 'adequate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {item.status === 'critical' ? 'Crítico' : item.status === 'low' ? 'Bajo' : item.status === 'adequate' ? 'Adecuado' : 'Bien'}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground">Stock actual: {item.currentStock} unidades</p>
                      <p className="text-muted-foreground">Días restantes: {item.daysUntilEmpty}</p>
                      {item.recommendedOrder > 0 && (
                        <p className="font-medium text-indigo-600">Pedir: {item.recommendedOrder} unidades</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
