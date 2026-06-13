import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireCmsAdmin } from '../../middleware/requireCmsAdmin'

export default async function cmsProductRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { series, status, search, page = '1', limit = '50', sort_by, sort_dir = 'asc' } = request.query as {
      series?: string
      status?: string
      search?: string
      page?: string
      limit?: string
      sort_by?: string
      sort_dir?: string
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where: Record<string, unknown> = {}
    if (series) where.series = series
    if (status) where.status = status
    if (search) where.name = { contains: search, mode: 'insensitive' }

    const validSortFields = ['name', 'series', 'nanoparticles', 'order']
    const sortDir = sort_dir === 'desc' ? 'desc' : 'asc'
    const orderBy = sort_by && validSortFields.includes(sort_by)
      ? { [sort_by]: sortDir }
      : [{ series: 'asc' as const }, { order: 'asc' as const }]

    const [products, total] = await Promise.all([
      fastify.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
      }),
      fastify.prisma.product.count({ where }),
    ])

    return reply.send({ success: true, data: products, total, page: parseInt(page), limit: parseInt(limit) })
  })

  fastify.get('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const product = await fastify.prisma.product.findUnique({ where: { id } })
    if (!product) return reply.status(404).send({ success: false, message: 'Produk tidak ditemukan' })
    return reply.send({ success: true, data: product })
  })

  fastify.post('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const body = request.body as {
      name: string
      series: string
      nanoparticles: string
      type: string
      description: string
      status?: string
      image_url?: string
      price?: number
      order?: number
    }

    const product = await fastify.prisma.product.create({ data: body })
    return reply.status(201).send({ success: true, data: product })
  })

  fastify.put('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as Partial<{
      name: string
      series: string
      nanoparticles: string
      type: string
      description: string
      status: string
      image_url: string
      price: number
      order: number
    }>

    const existing = await fastify.prisma.product.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Produk tidak ditemukan' })

    const product = await fastify.prisma.product.update({ where: { id }, data: body })
    return reply.send({ success: true, data: product })
  })

  fastify.delete('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = await fastify.prisma.product.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Produk tidak ditemukan' })

    await fastify.prisma.product.delete({ where: { id } })
    return reply.send({ success: true, message: 'Produk berhasil dihapus' })
  })
}
