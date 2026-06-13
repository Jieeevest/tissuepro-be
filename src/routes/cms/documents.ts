import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireCmsAdmin } from '../../middleware/requireCmsAdmin'

export default async function cmsDocumentRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { category, access, search, page = '1', limit = '20', sort_by = 'uploaded_at', sort_dir = 'desc' } = request.query as {
      category?: string
      access?: string
      search?: string
      page?: string
      limit?: string
      sort_by?: string
      sort_dir?: string
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (access) where.access = access
    if (search) where.name = { contains: search, mode: 'insensitive' }

    const validSortFields = ['name', 'uploaded_at', 'category']
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'uploaded_at'
    const sortDir = sort_dir === 'asc' ? 'asc' : 'desc'

    const [documents, total] = await Promise.all([
      fastify.prisma.document.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip,
        take: parseInt(limit),
      }),
      fastify.prisma.document.count({ where }),
    ])

    return reply.send({ success: true, data: documents, total, page: parseInt(page), limit: parseInt(limit) })
  })

  fastify.get('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const doc = await fastify.prisma.document.findUnique({ where: { id } })
    if (!doc) return reply.status(404).send({ success: false, message: 'Dokumen tidak ditemukan' })
    return reply.send({ success: true, data: doc })
  })

  fastify.post('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const body = request.body as {
      name: string
      category: string
      access?: string
      file_url: string
    }

    const doc = await fastify.prisma.document.create({ data: body })
    return reply.status(201).send({ success: true, data: doc })
  })

  fastify.put('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as Partial<{
      name: string
      category: string
      access: string
      file_url: string
    }>

    const existing = await fastify.prisma.document.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Dokumen tidak ditemukan' })

    const doc = await fastify.prisma.document.update({ where: { id }, data: body })
    return reply.send({ success: true, data: doc })
  })

  fastify.delete('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = await fastify.prisma.document.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Dokumen tidak ditemukan' })

    await fastify.prisma.document.delete({ where: { id } })
    return reply.send({ success: true, message: 'Dokumen berhasil dihapus' })
  })
}
