/**
 * Servicio de Notificaciones
 * Piano Emotion Manager
 * 
 * Gestiona las notificaciones push y en-app para la aplicación.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ==========================================
// TIPOS
// ==========================================

export type NotificationType = 
  | 'assignment_new'
  | 'assignment_accepted'
  | 'assignment_rejected'
  | 'assignment_started'
  | 'assignment_completed'
  | 'assignment_cancelled'
  | 'assignment_reassigned'
  | 'invitation_received'
  | 'invitation_accepted'
  | 'member_joined'
  | 'member_left'
  | 'reminder'
  | 'system';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: boolean;
  priority?: 'default' | 'high' | 'max';
}

export interface StoredNotification {
  id: string;
  userId: number;
  organizationId?: number;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface PushToken {
  userId: number;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
  createdAt: Date;
  lastUsedAt: Date;
}

// ==========================================
// CONFIGURACIÓN DE EXPO NOTIFICATIONS
// ==========================================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ==========================================
// SERVICIO DE NOTIFICACIONES
// ==========================================

class NotificationService {
  private pushTokens: Map<number, PushToken[]> = new Map();
  private notifications: StoredNotification[] = [];
  
  // ==========================================
  // GESTIÓN DE TOKENS
  // ==========================================
  
  /**
   * Registra el dispositivo para recibir notificaciones push
   */
  async registerForPushNotifications(userId: number): Promise<string | null> {
    try {
      // Verificar permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return null;
      }
      
      // Obtener token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID,
      });
      
      const token = tokenData.data;
      
      // Guardar token
      await this.savePushToken(userId, token);
      
      // Configurar canal de notificaciones en Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563eb',
        });
        
        await Notifications.setNotificationChannelAsync('assignments', {
          name: 'Asignaciones',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#22c55e',
        });
        
        await Notifications.setNotificationChannelAsync('urgent', {
          name: 'Urgente',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#ef4444',
        });
      }
      
      return token;
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
      return null;
    }
  }
  
  /**
   * Guarda un token de push en la base de datos
   */
  private async savePushToken(userId: number, token: string): Promise<void> {
    const platform = Platform.OS as 'ios' | 'android' | 'web';
    
    const pushTokenData: PushToken = {
      userId,
      token,
      platform,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    };
    
    // Guardar en memoria
    const userTokens = this.pushTokens.get(userId) || [];
    const existingIndex = userTokens.findIndex(t => t.token === token);
    
    if (existingIndex >= 0) {
      userTokens[existingIndex].lastUsedAt = new Date();
    } else {
      userTokens.push(pushTokenData);
    }
    
    this.pushTokens.set(userId, userTokens);
    
    // Guardar en base de datos
    try {
      const { db } = await import('@/drizzle/db');
      const { pushTokens: pushTokensTable } = await import('@/drizzle/notifications-schema');
      const { eq, and } = await import('drizzle-orm');
      
      // Verificar si ya existe
      const [existing] = await db
        .select()
        .from(pushTokensTable)
        .where(and(
          eq(pushTokensTable.userId, userId),
          eq(pushTokensTable.token, token)
        ));
      
      if (existing) {
        // Actualizar lastUsedAt
        await db
          .update(pushTokensTable)
          .set({ lastUsedAt: new Date(), isActive: true })
          .where(eq(pushTokensTable.id, existing.id));
      } else {
        // Insertar nuevo token
        await db.insert(pushTokensTable).values({
          userId,
          token,
          platform,
          isActive: true,
        });
      }
    } catch (error) {
      console.error('Error saving push token to database:', error);
    }
  }
  
  /**
   * Elimina un token de push
   */
  async removePushToken(userId: number, token: string): Promise<void> {
    const userTokens = this.pushTokens.get(userId) || [];
    const filtered = userTokens.filter(t => t.token !== token);
    this.pushTokens.set(userId, filtered);
    
    // Eliminar de base de datos
    try {
      const { db } = await import('@/drizzle/db');
      const { pushTokens: pushTokensTable } = await import('@/drizzle/notifications-schema');
      const { eq, and } = await import('drizzle-orm');
      
      await db
        .delete(pushTokensTable)
        .where(and(
          eq(pushTokensTable.userId, userId),
          eq(pushTokensTable.token, token)
        ));
    } catch (error) {
      console.error('Error removing push token from database:', error);
    }
  }
  
  // ==========================================
  // ENVÍO DE NOTIFICACIONES
  // ==========================================
  
  /**
   * Envía una notificación push a un usuario
   */
  async sendPushNotification(userId: number, payload: NotificationPayload): Promise<boolean> {
    try {
      const userTokens = this.pushTokens.get(userId) || [];
      
      if (userTokens.length === 0) {
        return false;
      }
      
      const messages = userTokens.map(tokenData => ({
        to: tokenData.token,
        title: payload.title,
        body: payload.body,
        data: {
          type: payload.type,
          ...payload.data,
        },
        sound: payload.sound !== false ? 'default' : undefined,
        badge: payload.badge,
        priority: payload.priority || 'high',
        channelId: this.getChannelId(payload.type),
      }));
      
      // Enviar a Expo Push Service
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
      
      const result = await response.json();
      
      if (result.errors) {
        console.error('❌ Push notification errors:', result.errors);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return false;
    }
  }
  
  /**
   * Envía una notificación a múltiples usuarios
   */
  async sendToMultipleUsers(userIds: number[], payload: NotificationPayload): Promise<void> {
    await Promise.all(userIds.map(userId => this.sendPushNotification(userId, payload)));
  }
  
  /**
   * Envía una notificación local (sin servidor)
   */
  async sendLocalNotification(payload: NotificationPayload): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: {
          type: payload.type,
          ...payload.data,
        },
        sound: payload.sound !== false,
        badge: payload.badge,
      },
      trigger: null, // Inmediato
    });
    
    return id;
  }
  
  /**
   * Programa una notificación para el futuro
   */
  async scheduleNotification(
    payload: NotificationPayload,
    triggerDate: Date
  ): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: {
          type: payload.type,
          ...payload.data,
        },
        sound: payload.sound !== false,
      },
      trigger: {
        date: triggerDate,
      },
    });
    
    return id;
  }
  
  /**
   * Cancela una notificación programada
   */
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
  
  /**
   * Cancela todas las notificaciones programadas
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
  
  // ==========================================
  // NOTIFICACIONES IN-APP
  // ==========================================
  
  /**
   * Guarda una notificación en el historial del usuario
   */
  async storeNotification(
    userId: number,
    payload: NotificationPayload,
    organizationId?: number
  ): Promise<StoredNotification> {
    const notification: StoredNotification = {
      id: this.generateId(),
      userId,
      organizationId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      isRead: false,
      createdAt: new Date(),
    };
    
    this.notifications.push(notification);
    
    // Guardar en base de datos
    try {
      const { db } = await import('@/drizzle/db');
      const { storedNotifications } = await import('@/drizzle/notifications-schema');
      
      await db.insert(storedNotifications).values({
        notificationId: notification.id,
        userId: notification.userId,
        organizationId: notification.organizationId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        isRead: false,
      });
    } catch (error) {
      console.error('Error storing notification in database:', error);
    }
    
    return notification;
  }
  
  /**
   * Obtiene las notificaciones de un usuario
   */
  async getUserNotifications(
    userId: number,
    options?: {
      organizationId?: number;
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<StoredNotification[]> {
    let filtered = this.notifications.filter(n => n.userId === userId);
    
    if (options?.organizationId) {
      filtered = filtered.filter(n => n.organizationId === options.organizationId);
    }
    
    if (options?.unreadOnly) {
      filtered = filtered.filter(n => !n.isRead);
    }
    
    // Ordenar por fecha descendente
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Paginación
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    
    return filtered.slice(offset, offset + limit);
  }
  
  /**
   * Marca una notificación como leída
   */
  async markAsRead(notificationId: string, userId: number): Promise<void> {
    const notification = this.notifications.find(
      n => n.id === notificationId && n.userId === userId
    );
    
    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date();
    }
    
    // Actualizar en base de datos
    try {
      const { db } = await import('@/drizzle/db');
      const { storedNotifications } = await import('@/drizzle/notifications-schema');
      const { eq, and } = await import('drizzle-orm');
      
      await db
        .update(storedNotifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(
          eq(storedNotifications.notificationId, notificationId),
          eq(storedNotifications.userId, userId)
        ));
    } catch (error) {
      console.error('Error marking notification as read in database:', error);
    }
  }
  
  /**
   * Marca todas las notificaciones como leídas
   */
  async markAllAsRead(userId: number, organizationId?: number): Promise<void> {
    this.notifications
      .filter(n => n.userId === userId && (!organizationId || n.organizationId === organizationId))
      .forEach(n => {
        n.isRead = true;
        n.readAt = new Date();
      });
    
    // Actualizar en base de datos
    try {
      const { db } = await import('@/drizzle/db');
      const { storedNotifications } = await import('@/drizzle/notifications-schema');
      const { eq, and, isNull } = await import('drizzle-orm');
      
      const conditions = [
        eq(storedNotifications.userId, userId),
        eq(storedNotifications.isRead, false),
      ];
      
      if (organizationId) {
        conditions.push(eq(storedNotifications.organizationId, organizationId));
      }
      
      await db
        .update(storedNotifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(...conditions));
    } catch (error) {
      console.error('Error marking all notifications as read in database:', error);
    }
  }
  
  /**
   * Obtiene el conteo de notificaciones no leídas
   */
  async getUnreadCount(userId: number, organizationId?: number): Promise<number> {
    return this.notifications.filter(
      n => n.userId === userId && 
           !n.isRead && 
           (!organizationId || n.organizationId === organizationId)
    ).length;
  }
  
  // ==========================================
  // NOTIFICACIONES ESPECÍFICAS
  // ==========================================
  
  /**
   * Notifica nueva asignación al técnico
   */
  async notifyNewAssignment(
    technicianUserId: number,
    data: {
      clientName: string;
      serviceType: string;
      scheduledDate: Date;
      priority: string;
      assignmentId: number;
      organizationId: number;
    }
  ): Promise<void> {
    const dateStr = data.scheduledDate.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    
    const payload: NotificationPayload = {
      type: 'assignment_new',
      title: '📋 Nueva Asignación',
      body: `${data.serviceType} para ${data.clientName} - ${dateStr}`,
      data: {
        assignmentId: data.assignmentId,
        organizationId: data.organizationId,
        screen: 'team/calendar',
      },
      priority: data.priority === 'urgent' ? 'max' : 'high',
    };
    
    await this.sendPushNotification(technicianUserId, payload);
    await this.storeNotification(technicianUserId, payload, data.organizationId);
  }
  
  /**
   * Notifica trabajo completado al manager
   */
  async notifyWorkCompleted(
    managerUserIds: number[],
    data: {
      technicianName: string;
      clientName: string;
      serviceType: string;
      assignmentId: number;
      organizationId: number;
    }
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: 'assignment_completed',
      title: '✅ Trabajo Completado',
      body: `${data.technicianName} completó ${data.serviceType} para ${data.clientName}`,
      data: {
        assignmentId: data.assignmentId,
        organizationId: data.organizationId,
        screen: 'team/calendar',
      },
    };
    
    await this.sendToMultipleUsers(managerUserIds, payload);
    
    for (const userId of managerUserIds) {
      await this.storeNotification(userId, payload, data.organizationId);
    }
  }
  
  /**
   * Notifica invitación aceptada
   */
  async notifyInvitationAccepted(
    inviterUserId: number,
    data: {
      newMemberName: string;
      organizationName: string;
      organizationId: number;
    }
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: 'invitation_accepted',
      title: '🎉 Invitación Aceptada',
      body: `${data.newMemberName} se ha unido a ${data.organizationName}`,
      data: {
        organizationId: data.organizationId,
        screen: 'team/members',
      },
    };
    
    await this.sendPushNotification(inviterUserId, payload);
    await this.storeNotification(inviterUserId, payload, data.organizationId);
  }
  
  // ==========================================
  // HELPERS
  // ==========================================
  
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getChannelId(type: NotificationType): string {
    if (type.startsWith('assignment')) {
      return 'assignments';
    }
    if (type === 'reminder' || type.includes('urgent')) {
      return 'urgent';
    }
    return 'default';
  }
}

// ==========================================
// EXPORTACIÓN
// ==========================================

export const notificationService = new NotificationService();
export default notificationService;
