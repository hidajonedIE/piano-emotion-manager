/**
 * Servicio de cálculo de tiempo de desplazamiento entre clientes
 * Usa la API de OpenRouteService (gratuita) o estimaciones basadas en distancia
 */

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface TravelEstimate {
  distance: number; // en kilómetros
  duration: number; // en minutos
  durationText: string;
  distanceText: string;
  mode: 'driving' | 'walking' | 'cycling';
}

export interface RouteStop {
  id: string;
  name: string;
  address: string;
  location?: Location;
  scheduledTime?: string;
  estimatedArrival?: string;
  travelFromPrevious?: TravelEstimate;
}

export interface OptimizedRoute {
  stops: RouteStop[];
  totalDistance: number;
  totalDuration: number;
  totalDistanceText: string;
  totalDurationText: string;
}

// API key de OpenRouteService (gratuita, 2000 requests/día)
// El usuario puede configurar su propia API key
const ORS_API_KEY = ''; // Se configura desde settings

class TravelTimeService {
  private apiKey: string = '';
  private geocodeCache: Map<string, Location> = new Map();

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Geocodificar una dirección a coordenadas
   */
  async geocodeAddress(address: string): Promise<Location | null> {
    // Verificar caché
    if (this.geocodeCache.has(address)) {
      return this.geocodeCache.get(address)!;
    }

    try {
      // Usar Nominatim (gratuito, sin API key)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { 'User-Agent': 'PianoEmotionManager/1.0' } }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const location: Location = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address,
        };
        this.geocodeCache.set(address, location);
        return location;
      }

      return null;
    } catch (error) {
      console.error('[TravelTime] Error geocoding:', error);
      return null;
    }
  }

  /**
   * Calcular distancia entre dos puntos (fórmula Haversine)
   */
  calculateDistance(from: Location, to: Location): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(to.lat - from.lat);
    const dLon = this.toRad(to.lng - from.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.lat)) *
        Math.cos(this.toRad(to.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Estimar tiempo de viaje basado en distancia
   */
  estimateTravelTime(
    distance: number,
    mode: 'driving' | 'walking' | 'cycling' = 'driving'
  ): TravelEstimate {
    // Velocidades medias aproximadas
    const speeds = {
      driving: 40, // km/h en ciudad
      cycling: 15,
      walking: 5,
    };

    const speed = speeds[mode];
    const duration = (distance / speed) * 60; // minutos

    return {
      distance,
      duration: Math.round(duration),
      durationText: this.formatDuration(duration),
      distanceText: this.formatDistance(distance),
      mode,
    };
  }

  /**
   * Obtener tiempo de viaje usando API de rutas (si hay API key)
   */
  async getTravelTime(
    from: Location,
    to: Location,
    mode: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<TravelEstimate> {
    // Si no hay API key, usar estimación basada en distancia
    if (!this.apiKey) {
      const distance = this.calculateDistance(from, to);
      return this.estimateTravelTime(distance, mode);
    }

    try {
      const profile = mode === 'driving' ? 'driving-car' : mode === 'cycling' ? 'cycling-regular' : 'foot-walking';
      
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${this.apiKey}&start=${from.lng},${from.lat}&end=${to.lng},${to.lat}`
      );

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const route = data.features[0].properties.summary;
        return {
          distance: route.distance / 1000, // metros a km
          duration: route.duration / 60, // segundos a minutos
          durationText: this.formatDuration(route.duration / 60),
          distanceText: this.formatDistance(route.distance / 1000),
          mode,
        };
      }
    } catch (error) {
      console.error('[TravelTime] Error getting route:', error);
    }

    // Fallback a estimación
    const distance = this.calculateDistance(from, to);
    return this.estimateTravelTime(distance, mode);
  }

  /**
   * Calcular ruta entre múltiples paradas
   */
  async calculateRoute(stops: RouteStop[]): Promise<OptimizedRoute> {
    const result: OptimizedRoute = {
      stops: [...stops],
      totalDistance: 0,
      totalDuration: 0,
      totalDistanceText: '',
      totalDurationText: '',
    };

    // Geocodificar direcciones que no tienen coordenadas
    for (const stop of result.stops) {
      if (!stop.location && stop.address) {
        stop.location = await this.geocodeAddress(stop.address) || undefined;
      }
    }

    // Calcular tiempo entre paradas consecutivas
    for (let i = 1; i < result.stops.length; i++) {
      const prevStop = result.stops[i - 1];
      const currentStop = result.stops[i];

      if (prevStop.location && currentStop.location) {
        const travel = await this.getTravelTime(prevStop.location, currentStop.location);
        currentStop.travelFromPrevious = travel;
        result.totalDistance += travel.distance;
        result.totalDuration += travel.duration;

        // Calcular hora estimada de llegada
        if (prevStop.scheduledTime || prevStop.estimatedArrival) {
          const departureTime = prevStop.scheduledTime || prevStop.estimatedArrival;
          if (departureTime) {
            const arrival = new Date(departureTime);
            arrival.setMinutes(arrival.getMinutes() + travel.duration);
            currentStop.estimatedArrival = arrival.toISOString();
          }
        }
      }
    }

    result.totalDistanceText = this.formatDistance(result.totalDistance);
    result.totalDurationText = this.formatDuration(result.totalDuration);

    return result;
  }

  /**
   * Optimizar orden de paradas (algoritmo del vecino más cercano)
   */
  async optimizeRoute(stops: RouteStop[], startLocation?: Location): Promise<OptimizedRoute> {
    if (stops.length <= 2) {
      return this.calculateRoute(stops);
    }

    // Geocodificar todas las paradas
    const stopsWithLocations: RouteStop[] = [];
    for (const stop of stops) {
      const location = stop.location || (stop.address ? await this.geocodeAddress(stop.address) : null);
      stopsWithLocations.push({ ...stop, location: location || undefined });
    }

    // Filtrar paradas sin ubicación
    const validStops = stopsWithLocations.filter(s => s.location);
    if (validStops.length === 0) {
      return this.calculateRoute(stops);
    }

    // Algoritmo del vecino más cercano
    const optimized: RouteStop[] = [];
    const remaining = [...validStops];
    
    // Punto de inicio
    let currentLocation = startLocation || remaining[0].location!;
    
    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].location) {
          const distance = this.calculateDistance(currentLocation, remaining[i].location!);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = i;
          }
        }
      }

      const nearest = remaining.splice(nearestIndex, 1)[0];
      optimized.push(nearest);
      currentLocation = nearest.location!;
    }

    return this.calculateRoute(optimized);
  }

  /**
   * Formatear duración en texto legible
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (mins === 0) {
      return `${hours} h`;
    }
    return `${hours} h ${mins} min`;
  }

  /**
   * Formatear distancia en texto legible
   */
  formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  }

  /**
   * Generar URL de Google Maps para navegación
   */
  getGoogleMapsUrl(from: Location, to: Location): string {
    return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=driving`;
  }

  /**
   * Generar URL de Google Maps para ruta con múltiples paradas
   */
  getGoogleMapsRouteUrl(stops: RouteStop[]): string {
    const validStops = stops.filter(s => s.location);
    if (validStops.length < 2) return '';

    const origin = validStops[0].location!;
    const destination = validStops[validStops.length - 1].location!;
    const waypoints = validStops
      .slice(1, -1)
      .map(s => `${s.location!.lat},${s.location!.lng}`)
      .join('|');

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    
    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }

    return url;
  }
}

export const travelTimeService = new TravelTimeService();
export default travelTimeService;
