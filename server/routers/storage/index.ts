/**
 * Storage Router
 * Piano Emotion Manager
 * 
 * tRPC router for handling file uploads to Cloudflare R2 with compression.
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../../_core/trpc.js';
import { TRPCError } from '@trpc/server';
import { r2Upload, r2Delete, r2GetSignedUrl, generateStorageKey, isR2Configured } from '../../services/r2-storage.js';
import { hasFeatureAccess } from '../../config/subscription-plans.js';

// Input schemas
const uploadImageSchema = z.object({
  base64Data: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  folder: z.string().optional().default('uploads'),
  compress: z.boolean().optional().default(true),
  maxWidth: z.number().optional().default(1920),
  maxHeight: z.number().optional().default(1080),
  quality: z.number().min(1).max(100).optional().default(80),
});

const deleteFileSchema = z.object({
  key: z.string(),
});

const getSignedUrlSchema = z.object({
  key: z.string(),
  expiresIn: z.number().optional().default(3600),
});

export const storageRouter = router({
  /**
   * Upload an image to R2 storage with optional compression
   */
  uploadImage: protectedProcedure
    .input(uploadImageSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if R2 is configured
      if (!isR2Configured()) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'El almacenamiento en la nube no está configurado',
        });
      }
      
      // Check subscription access
      const userPlan = ctx.user?.subscriptionPlan || 'free';
      if (!hasFeatureAccess(userPlan as any, 'image_storage')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Tu plan actual no incluye almacenamiento en la nube. Actualiza tu plan para acceder a esta función.',
        });
      }
      
      try {
        // Decode base64 data
        const buffer = Buffer.from(input.base64Data, 'base64');
        
        // Generate storage key
        const key = generateStorageKey(
          input.folder,
          input.filename,
          ctx.user?.id
        );
        
        // Upload to R2 with compression
        const result = await r2Upload(key, buffer, input.mimeType, {
          compress: input.compress,
          compressionOptions: {
            maxWidth: input.maxWidth,
            maxHeight: input.maxHeight,
            quality: input.quality,
          },
        });
        
        return {
          key: result.key,
          url: result.url,
          size: result.size,
          originalSize: result.originalSize,
          compressionRatio: result.compressionRatio,
        };
      } catch (error) {
        console.error('Upload error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Error al subir el archivo',
        });
      }
    }),
  
  /**
   * Upload a document (PDF, DOC, etc.) to R2 storage
   */
  uploadDocument: protectedProcedure
    .input(z.object({
      base64Data: z.string(),
      filename: z.string(),
      mimeType: z.string(),
      folder: z.string().optional().default('documents'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if R2 is configured
      if (!isR2Configured()) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'El almacenamiento en la nube no está configurado',
        });
      }
      
      // Check subscription access
      const userPlan = ctx.user?.subscriptionPlan || 'free';
      if (!hasFeatureAccess(userPlan as any, 'document_storage')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Tu plan actual no incluye almacenamiento de documentos. Actualiza tu plan para acceder a esta función.',
        });
      }
      
      try {
        // Decode base64 data
        const buffer = Buffer.from(input.base64Data, 'base64');
        
        // Generate storage key
        const key = generateStorageKey(
          input.folder,
          input.filename,
          ctx.user?.id
        );
        
        // Upload to R2 (no compression for documents)
        const result = await r2Upload(key, buffer, input.mimeType, {
          compress: false,
        });
        
        return {
          key: result.key,
          url: result.url,
          size: result.size,
        };
      } catch (error) {
        console.error('Upload error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Error al subir el documento',
        });
      }
    }),
  
  /**
   * Delete a file from R2 storage
   */
  deleteFile: protectedProcedure
    .input(deleteFileSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if R2 is configured
      if (!isR2Configured()) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'El almacenamiento en la nube no está configurado',
        });
      }
      
      // Verify user owns this file (key should contain user ID)
      if (!input.key.includes(ctx.user?.id || '')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No tienes permiso para eliminar este archivo',
        });
      }
      
      try {
        await r2Delete(input.key);
        return { success: true };
      } catch (error) {
        console.error('Delete error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Error al eliminar el archivo',
        });
      }
    }),
  
  /**
   * Get a signed URL for accessing a file
   */
  getSignedUrl: protectedProcedure
    .input(getSignedUrlSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if R2 is configured
      if (!isR2Configured()) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'El almacenamiento en la nube no está configurado',
        });
      }
      
      try {
        const url = await r2GetSignedUrl(input.key, input.expiresIn);
        return { url };
      } catch (error) {
        console.error('Get URL error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Error al obtener URL',
        });
      }
    }),
  
  /**
   * Check storage status and usage
   */
  getStorageStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const userPlan = ctx.user?.subscriptionPlan || 'free';
      const hasImageStorage = hasFeatureAccess(userPlan as any, 'image_storage');
      const hasDocumentStorage = hasFeatureAccess(userPlan as any, 'document_storage');
      
      return {
        isConfigured: isR2Configured(),
        hasImageStorage,
        hasDocumentStorage,
        // TODO: Add actual usage tracking
        usedBytes: 0,
        limitBytes: hasImageStorage ? 2 * 1024 * 1024 * 1024 : 0, // 2GB for basic
      };
    }),
});

export type StorageRouter = typeof storageRouter;
