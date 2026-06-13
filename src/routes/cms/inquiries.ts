import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireCmsAdmin } from '../../middleware/requireCmsAdmin'

export default async function cmsInquiryRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { page = '1', limit = '20', status, search, sort_by = 'created_at', sort_dir = 'desc' } = request.query as {
      page?: string
      limit?: string
      status?: string
      search?: string
      sort_by?: string
      sort_dir?: string
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { clinic: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }

    const validSortFields = ['name', 'created_at', 'status', 'city']
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at'
    const sortDir = sort_dir === 'asc' ? 'asc' : 'desc'

    const [inquiries, total] = await Promise.all([
      fastify.prisma.inquiry.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip,
        take: parseInt(limit),
      }),
      fastify.prisma.inquiry.count({ where }),
    ])

    return reply.send({ success: true, data: inquiries, total, page: parseInt(page), limit: parseInt(limit) })
  })

  fastify.get('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const inquiry = await fastify.prisma.inquiry.findUnique({ where: { id } })
    if (!inquiry) return reply.status(404).send({ success: false, message: 'Inquiry tidak ditemukan' })
    return reply.send({ success: true, data: inquiry })
  })

  fastify.patch('/:id/status', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status, notes } = request.body as { status: string; notes?: string }

    const valid = ['baru', 'diproses', 'selesai']
    if (!valid.includes(status)) {
      return reply.status(400).send({ success: false, message: 'Status tidak valid' })
    }

    const existing = await fastify.prisma.inquiry.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Inquiry tidak ditemukan' })

    const inquiry = await fastify.prisma.inquiry.update({
      where: { id },
      data: { status, ...(notes !== undefined && { notes }) },
    })

    return reply.send({ success: true, data: inquiry })
  })

  fastify.delete('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = await fastify.prisma.inquiry.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Inquiry tidak ditemukan' })

    await fastify.prisma.inquiry.delete({ where: { id } })
    return reply.send({ success: true, message: 'Inquiry berhasil dihapus' })
  })
}
