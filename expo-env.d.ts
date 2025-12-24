/// <reference types="expo/types" />

// Declaraciones de tipos para módulos de Expo
declare module 'expo-haptics' {
  export enum ImpactFeedbackStyle {
    Light = 'light',
    Medium = 'medium',
    Heavy = 'heavy',
  }
  
  export enum NotificationFeedbackType {
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
  }
  
  export function impactAsync(style?: ImpactFeedbackStyle): Promise<void>;
  export function notificationAsync(type?: NotificationFeedbackType): Promise<void>;
  export function selectionAsync(): Promise<void>;
}

declare module 'expo-sharing' {
  export function isAvailableAsync(): Promise<boolean>;
  export function shareAsync(url: string, options?: { mimeType?: string; dialogTitle?: string; UTI?: string }): Promise<void>;
}

declare module 'expo-notifications' {
  export interface NotificationRequest {
    identifier: string;
    content: NotificationContent;
    trigger: NotificationTrigger | null;
  }
  
  export interface NotificationContent {
    title?: string | null;
    subtitle?: string | null;
    body?: string | null;
    data?: Record<string, unknown>;
    sound?: boolean | string;
    badge?: number | null;
  }
  
  export interface NotificationTrigger {
    type: string;
    repeats?: boolean;
    seconds?: number;
    date?: Date;
  }
  
  export function getPermissionsAsync(): Promise<{ status: string; granted: boolean }>;
  export function requestPermissionsAsync(): Promise<{ status: string; granted: boolean }>;
  export function getExpoPushTokenAsync(options?: { projectId?: string }): Promise<{ data: string }>;
  export function scheduleNotificationAsync(request: { content: NotificationContent; trigger: NotificationTrigger | null }): Promise<string>;
  export function cancelScheduledNotificationAsync(identifier: string): Promise<void>;
  export function cancelAllScheduledNotificationsAsync(): Promise<void>;
  export function setNotificationHandler(handler: { handleNotification: () => Promise<{ shouldShowAlert: boolean; shouldPlaySound: boolean; shouldSetBadge: boolean }> }): void;
  export function addNotificationReceivedListener(listener: (notification: any) => void): { remove: () => void };
  export function addNotificationResponseReceivedListener(listener: (response: any) => void): { remove: () => void };
}

declare module 'expo-file-system' {
  export const documentDirectory: string | null;
  export const cacheDirectory: string | null;
  
  export function getInfoAsync(fileUri: string, options?: { md5?: boolean; size?: boolean }): Promise<{ exists: boolean; uri: string; size?: number; md5?: string; isDirectory?: boolean }>;
  export function readAsStringAsync(fileUri: string, options?: { encoding?: string }): Promise<string>;
  export function writeAsStringAsync(fileUri: string, contents: string, options?: { encoding?: string }): Promise<void>;
  export function deleteAsync(fileUri: string, options?: { idempotent?: boolean }): Promise<void>;
  export function moveAsync(options: { from: string; to: string }): Promise<void>;
  export function copyAsync(options: { from: string; to: string }): Promise<void>;
  export function makeDirectoryAsync(fileUri: string, options?: { intermediates?: boolean }): Promise<void>;
  export function readDirectoryAsync(fileUri: string): Promise<string[]>;
  export function downloadAsync(uri: string, fileUri: string, options?: { headers?: Record<string, string> }): Promise<{ uri: string; status: number; headers: Record<string, string> }>;
  export function uploadAsync(url: string, fileUri: string, options?: { httpMethod?: string; uploadType?: number; fieldName?: string; mimeType?: string; headers?: Record<string, string> }): Promise<{ status: number; body: string; headers: Record<string, string> }>;
}

declare module 'expo-secure-store' {
  export function getItemAsync(key: string, options?: { keychainService?: string }): Promise<string | null>;
  export function setItemAsync(key: string, value: string, options?: { keychainService?: string; keychainAccessible?: number }): Promise<void>;
  export function deleteItemAsync(key: string, options?: { keychainService?: string }): Promise<void>;
  export function isAvailableAsync(): Promise<boolean>;
}

declare module 'expo-print' {
  export interface PrintOptions {
    html?: string;
    uri?: string;
    width?: number;
    height?: number;
    orientation?: 'portrait' | 'landscape';
    margins?: { top: number; right: number; bottom: number; left: number };
  }
  
  export function printAsync(options: PrintOptions): Promise<void>;
  export function printToFileAsync(options: PrintOptions): Promise<{ uri: string }>;
  export function selectPrinterAsync(): Promise<{ name: string; url: string }>;
}

declare module 'expo-camera' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';
  
  export interface CameraProps extends ViewProps {
    type?: 'front' | 'back';
    flashMode?: 'on' | 'off' | 'auto' | 'torch';
    autoFocus?: boolean;
    zoom?: number;
    onBarCodeScanned?: (result: { type: string; data: string }) => void;
    barCodeScannerSettings?: { barCodeTypes: string[] };
  }
  
  export const Camera: ComponentType<CameraProps>;
  export function requestCameraPermissionsAsync(): Promise<{ status: string; granted: boolean }>;
  export function getCameraPermissionsAsync(): Promise<{ status: string; granted: boolean }>;
}

declare module 'expo-crypto' {
  export enum CryptoDigestAlgorithm {
    SHA1 = 'SHA-1',
    SHA256 = 'SHA-256',
    SHA384 = 'SHA-384',
    SHA512 = 'SHA-512',
    MD5 = 'MD5',
  }
  
  export function digestStringAsync(algorithm: CryptoDigestAlgorithm, data: string, options?: { encoding?: 'hex' | 'base64' }): Promise<string>;
  export function getRandomBytesAsync(byteCount: number): Promise<Uint8Array>;
  export function randomUUID(): string;
}

// Declaraciones adicionales para módulos npm
declare module 'qrcode' {
  export function toDataURL(text: string, options?: any): Promise<string>;
  export function toString(text: string, options?: any): Promise<string>;
  export function toCanvas(canvas: any, text: string, options?: any): Promise<void>;
}

declare module 'jstoxml' {
  export function toXML(obj: any, options?: any): string;
}
