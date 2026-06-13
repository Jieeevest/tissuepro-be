import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireCmsAdmin } from '../../middleware/requireCmsAdmin'
import { uploadFile, deleteFile } from '../../lib/minio'

export default async function cmsMediaRoutes(fastify: FastifyInstance) {
  fastify.post('/upload', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const file = await request.file()
    if (!file) return reply.status(400).send({ success: false, message: 'Tidak ada file yang dikirim' })

    const { folder = 'cms' } = request.query as { folder?: string }
    const buffer = await file.toBuffer()
    const { url } = await uploadFile(buffer, file.filename, file.mimetype, folder)

    return reply.status(201).send({ success: true, data: { url, filename: file.filename, mimeType: file.mimetype, size: buffer.length } })
  })

  fastify.delete('/:encodedPath', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { encodedPath } = request.params as { encodedPath: string }
    const filePath = decodeURIComponent(encodedPath)

    try {
      await deleteFile(filePath)
    } catch {
      return reply.status(404).send({ success: false, message: 'File tidak ditemukan' })
    }

    return reply.send({ success: true })
  })
}
