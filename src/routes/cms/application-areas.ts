import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireCmsAdmin } from '../../middleware/requireCmsAdmin'

export default async function cmsApplicationAreaRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { page = '1', limit = '50', search, is_active, sort_by = 'order', sort_dir = 'asc' } = request.query as {
      page?: string
      limit?: string
      search?: string
      is_active?: string
      sort_by?: string
      sort_dir?: string
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where: Record<string, unknown> = {}
    if (search) where.name = { contains: search, mode: 'insensitive' }
    if (is_active === 'true') where.is_active = true
    if (is_active === 'false') where.is_active = false

    const validSortFields = ['name', 'specialty', 'order']
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'order'
    const sortDir = sort_dir === 'desc' ? 'desc' : 'asc'

    const [areas, total] = await Promise.all([
      fastify.prisma.applicationArea.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip,
        take: parseInt(limit),
      }),
      fastify.prisma.applicationArea.count({ where }),
    ])

    return reply.send({ success: true, data: areas, total, page: parseInt(page), limit: parseInt(limit) })
  })

  fastify.get('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const area = await fastify.prisma.applicationArea.findUnique({ where: { id } })
    if (!area) return reply.status(404).send({ success: false, message: 'Area tidak ditemukan' })
    return reply.send({ success: true, data: area })
  })

  fastify.post('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const body = request.body as {
      name: string
      specialty: string
      description: string
      icon: string
      order?: number
      is_active?: boolean
    }

    const area = await fastify.prisma.applicationArea.create({ data: body })
    return reply.status(201).send({ success: true, data: area })
  })

  fastify.put('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as Partial<{
      name: string
      specialty: string
      description: string
      icon: string
      order: number
      is_active: boolean
    }>

    const existing = await fastify.prisma.applicationArea.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Area tidak ditemukan' })

    const area = await fastify.prisma.applicationArea.update({ where: { id }, data: body })
    return reply.send({ success: true, data: area })
  })

  fastify.delete('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = await fastify.prisma.applicationArea.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Area tidak ditemukan' })

    await fastify.prisma.applicationArea.delete({ where: { id } })
    return reply.send({ success: true, message: 'Area berhasil dihapus' })
  })
}
