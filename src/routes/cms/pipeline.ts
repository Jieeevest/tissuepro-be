import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireCmsAdmin } from '../../middleware/requireCmsAdmin'

export default async function cmsPipelineRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { page = '1', limit = '20', stage, search, sort_by, sort_dir = 'asc' } = request.query as {
      page?: string
      limit?: string
      stage?: string
      search?: string
      sort_by?: string
      sort_dir?: string
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where: Record<string, unknown> = {}
    if (stage) where.stage = stage
    if (search) where.product_name = { contains: search, mode: 'insensitive' }

    const validSortFields = ['product_name', 'stage', 'order']
    const sortDir = sort_dir === 'desc' ? 'desc' : 'asc'
    const orderBy = sort_by && validSortFields.includes(sort_by)
      ? { [sort_by]: sortDir }
      : [{ stage: 'asc' as const }, { order: 'asc' as const }]

    const [items, total] = await Promise.all([
      fastify.prisma.pipelineItem.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
      }),
      fastify.prisma.pipelineItem.count({ where }),
    ])

    return reply.send({ success: true, data: items, total, page: parseInt(page), limit: parseInt(limit) })
  })

  fastify.get('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const item = await fastify.prisma.pipelineItem.findUnique({ where: { id } })
    if (!item) return reply.status(404).send({ success: false, message: 'Pipeline item tidak ditemukan' })
    return reply.send({ success: true, data: item })
  })

  fastify.post('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const body = request.body as {
      product_name: string
      platform: string
      stage: string
      order?: number
    }

    const item = await fastify.prisma.pipelineItem.create({ data: body })
    return reply.status(201).send({ success: true, data: item })
  })

  fastify.put('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as Partial<{
      product_name: string
      platform: string
      stage: string
      order: number
    }>

    const existing = await fastify.prisma.pipelineItem.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Pipeline item tidak ditemukan' })

    const item = await fastify.prisma.pipelineItem.update({ where: { id }, data: body })
    return reply.send({ success: true, data: item })
  })

  fastify.delete('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = await fastify.prisma.pipelineItem.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Pipeline item tidak ditemukan' })

    await fastify.prisma.pipelineItem.delete({ where: { id } })
    return reply.send({ success: true, message: 'Pipeline item berhasil dihapus' })
  })
}
