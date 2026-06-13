import { Client } from 'minio'
import fs from 'fs'
import path from 'path'

let isMinioAvailable = false

export const minioClient = new Client({
  endPoint:  process.env.MINIO_ENDPOINT  ?? 'localhost',
  port:      parseInt(process.env.MINIO_PORT ?? '9000'),
  useSSL:    process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
})

const BUCKET = process.env.MINIO_BUCKET ?? 'tissuepro'

export async function initMinioBucket(): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(BUCKET)
    if (!exists) {
      await minioClient.makeBucket(BUCKET)
      const policy = {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET}/*`],
        }],
      }
      await minioClient.setBucketPolicy(BUCKET, JSON.stringify(policy))
      console.log(`MinIO bucket "${BUCKET}" created`)
    } else {
      console.log(`MinIO bucket "${BUCKET}" exists`)
    }
    isMinioAvailable = true
  } catch {
    console.warn('MinIO not available, falling back to local storage')
    isMinioAvailable = false
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
  }
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folder = 'uploads',
): Promise<{ path: string; url: string }> {
  const fileName = `${Date.now()}-${filename}`
  const filePath = `${folder}/${fileName}`

  if (isMinioAvailable) {
    try {
      await minioClient.putObject(BUCKET, filePath, buffer, buffer.length, { 'Content-Type': mimeType })
      return { path: filePath, url: getPublicUrl(filePath) }
    } catch {
      isMinioAvailable = false
    }
  }

  // Local fallback
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
  fs.writeFileSync(path.join(uploadsDir, fileName), buffer)

  const baseUrl = process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 5176}`
  return { path: filePath, url: `${baseUrl}/public/uploads/${fileName}` }
}

export async function deleteFile(filePath: string): Promise<void> {
  if (isMinioAvailable) {
    await minioClient.removeObject(BUCKET, filePath)
  }
}

export function getPublicUrl(filePath: string): string {
  if (process.env.MINIO_PUBLIC_URL) {
    return `${process.env.MINIO_PUBLIC_URL.replace(/\/$/, '')}/${BUCKET}/${filePath}`
  }
  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'
  return `${protocol}://${process.env.MINIO_ENDPOINT ?? 'localhost'}:${process.env.MINIO_PORT ?? '9000'}/${BUCKET}/${filePath}`
}

export async function getPresignedUrl(filePath: string, expirySeconds = 3600): Promise<string> {
  return minioClient.presignedGetObject(BUCKET, filePath, expirySeconds)
}
