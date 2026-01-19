/**
 * Cloudflare R2 Storage Service with Image Compression
 * Piano Emotion Manager
 * 
 * This service handles file uploads to Cloudflare R2 with automatic
 * image compression using Sharp library to optimize storage and bandwidth.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { ENV } from "../_core/env.js";

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
}

interface UploadResult {
  key: string;
  url: string;
  size: number;
  originalSize?: number;
  compressionRatio?: number;
}

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

const DEFAULT_COMPRESSION: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 80,
  format: 'webp',
};

let s3Client: S3Client | null = null;

// Type assertion para asegurar que el cliente tiene el método send
type S3ClientWithSend = S3Client & {
  send<InputType extends any, OutputType extends any>(
    command: any
  ): Promise<OutputType>;
};

function getR2Config(): R2Config {
  const config: R2Config = {
    accountId: ENV.r2AccountId,
    accessKeyId: ENV.r2AccessKeyId,
    secretAccessKey: ENV.r2SecretAccessKey,
    bucketName: ENV.r2BucketName,
    endpoint: ENV.r2Endpoint,
  };

  if (!config.accountId || !config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
    throw new Error(
      "R2 storage credentials missing: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME"
    );
  }

  return config;
}

function getS3Client(): S3ClientWithSend {
  if (s3Client) return s3Client;
  
  const config = getR2Config();
  
  s3Client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  
  return s3Client as S3ClientWithSend;
}

/**
 * Compress image using Sharp library
 * Supports JPEG, PNG, WebP, and other formats
 */
async function compressImage(
  imageData: Buffer,
  mimeType: string,
  options: CompressionOptions = DEFAULT_COMPRESSION
): Promise<{ data: Buffer; mimeType: string; compressed: boolean }> {
  // For non-image files, return as-is
  if (!mimeType.startsWith("image/")) {
    return { data: imageData, mimeType, compressed: false };
  }

  // For SVG, return as-is (vector format)
  if (mimeType === "image/svg+xml") {
    return { data: imageData, mimeType, compressed: false };
  }

  // For GIF, return as-is (animated images)
  if (mimeType === "image/gif") {
    return { data: imageData, mimeType, compressed: false };
  }

  try {
    // Get image metadata
    const metadata = await sharp(imageData).metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;
    
    // Calculate new dimensions maintaining aspect ratio
    let newWidth = originalWidth;
    let newHeight = originalHeight;
    
    const maxWidth = options.maxWidth || DEFAULT_COMPRESSION.maxWidth!;
    const maxHeight = options.maxHeight || DEFAULT_COMPRESSION.maxHeight!;
    
    if (originalWidth > maxWidth || originalHeight > maxHeight) {
      const widthRatio = maxWidth / originalWidth;
      const heightRatio = maxHeight / originalHeight;
      const ratio = Math.min(widthRatio, heightRatio);
      
      newWidth = Math.round(originalWidth * ratio);
      newHeight = Math.round(originalHeight * ratio);
    }
    
    // Determine output format
    const outputFormat = options.format || DEFAULT_COMPRESSION.format!;
    const quality = options.quality || DEFAULT_COMPRESSION.quality!;
    
    let sharpInstance = sharp(imageData);
    
    // Resize if needed
    if (newWidth !== originalWidth || newHeight !== originalHeight) {
      sharpInstance = sharpInstance.resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Convert to output format with compression
    let outputBuffer: Buffer;
    let outputMimeType: string;
    
    switch (outputFormat) {
      case 'webp':
        outputBuffer = await sharpInstance.webp({ quality }).toBuffer();
        outputMimeType = 'image/webp';
        break;
      case 'jpeg':
        outputBuffer = await sharpInstance.jpeg({ quality, mozjpeg: true }).toBuffer();
        outputMimeType = 'image/jpeg';
        break;
      case 'png':
        outputBuffer = await sharpInstance.png({ compressionLevel: 9 }).toBuffer();
        outputMimeType = 'image/png';
        break;
      default:
        outputBuffer = await sharpInstance.webp({ quality }).toBuffer();
        outputMimeType = 'image/webp';
    }
    
    // Only use compressed version if it's smaller
    if (outputBuffer.length < imageData.length) {
      return {
        data: outputBuffer,
        mimeType: outputMimeType,
        compressed: true,
      };
    }
    
    // Return original if compression didn't help
    return { data: imageData, mimeType, compressed: false };
  } catch (error) {
    console.error("Image compression failed:", error);
    return { data: imageData, mimeType, compressed: false };
  }
}

/**
 * Upload a file to R2 storage
 */
export async function r2Upload(
  key: string,
  data: Buffer | Uint8Array,
  contentType: string,
  options?: {
    compress?: boolean;
    compressionOptions?: CompressionOptions;
    metadata?: Record<string, string>;
  }
): Promise<UploadResult> {
  const config = getR2Config();
  const client = getS3Client();
  const originalSize = data.length;
  
  // Convert to Buffer if needed
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  
  // Compress if requested and it's an image
  let finalData = buffer;
  let finalContentType = contentType;
  let compressionRatio: number | undefined;
  
  if (options?.compress !== false && contentType.startsWith("image/")) {
    const compressed = await compressImage(
      buffer,
      contentType,
      options?.compressionOptions
    );
    finalData = compressed.data;
    finalContentType = compressed.mimeType;
    
    if (compressed.compressed) {
      compressionRatio = originalSize / finalData.length;
    }
  }
  
  // Normalize key
  const normalizedKey = key.replace(/^\/+/, "");
  
  // Prepare metadata
  const metadata: Record<string, string> = {
    ...options?.metadata,
    'original-size': originalSize.toString(),
    'upload-date': new Date().toISOString(),
  };
  
  if (compressionRatio) {
    metadata['compression-ratio'] = compressionRatio.toFixed(2);
  }
  
  // Upload to R2
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: normalizedKey,
    Body: finalData,
    ContentType: finalContentType,
    Metadata: metadata,
  });
  
  await client.send(command);
  
  // Generate public URL
  const publicUrl = `${config.endpoint}/${normalizedKey}`;
  
  return {
    key: normalizedKey,
    url: publicUrl,
    size: finalData.length,
    originalSize: originalSize !== finalData.length ? originalSize : undefined,
    compressionRatio,
  };
}

/**
 * Delete a file from R2 storage
 */
export async function r2Delete(key: string): Promise<void> {
  const config = getR2Config();
  const client = getS3Client();
  const normalizedKey = key.replace(/^\/+/, "");
  
  const command = new DeleteObjectCommand({
    Bucket: config.bucketName,
    Key: normalizedKey,
  });
  
  await client.send(command);
}

/**
 * Get a signed URL for temporary access to a private file
 */
export async function r2GetSignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const config = getR2Config();
  const client = getS3Client();
  const normalizedKey = key.replace(/^\/+/, "");
  
  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: normalizedKey,
  });
  
  const signedUrl = await getSignedUrl(client, command, { expiresIn });
  return signedUrl;
}

/**
 * Check if R2 storage is configured
 */
export function isR2Configured(): boolean {
  try {
    getR2Config();
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a unique key for file storage
 */
export function generateStorageKey(
  prefix: string,
  filename: string,
  userId?: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = filename.split(".").pop() || "bin";
  const sanitizedFilename = filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .substring(0, 50);
  
  const parts = [prefix];
  if (userId) parts.push(userId);
  parts.push(`${timestamp}-${random}-${sanitizedFilename}.${ext}`);
  
  return parts.join("/");
}

export type { UploadResult, CompressionOptions, R2Config };
