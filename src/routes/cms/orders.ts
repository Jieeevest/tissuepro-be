import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireCmsAdmin } from '../../middleware/requireCmsAdmin'

const VALID_STATUSES = ['pending', 'awaiting_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']

export default async function cmsOrderRoutes(fastify: FastifyInstance) {
  const preHandler = [authenticate, requireCmsAdmin]

  // GET /api/cms/orders
  fastify.get('/', { preHandler }, async (request, reply) => {
    const { status, page = '1', limit = '20' } = request.query as {
      status?: string
      page?: string
      limit?: string
    }

    const take = Math.min(Number(limit), 100)
    const skip = (Number(page) - 1) * take
    const where = status ? { status } : {}

    const [orders, total] = await Promise.all([
      fastify.prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, full_name: true, email: true, phone: true } },
          items: true,
          order_payment: { select: { status: true, payment_method: true } },
        },
        orderBy: { created_at: 'desc' },
        take,
        skip,
      }),
      fastify.prisma.order.count({ where }),
    ])

    return reply.send({ success: true, data: orders, meta: { total, page: Number(page), limit: take } })
  })

  // GET /api/cms/orders/:id
  fastify.get('/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const order = await fastify.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, full_name: true, email: true, phone: true, institution: true, city: true } },
        items: { include: { product: { select: { id: true, name: true, image_url: true } } } },
        order_payment: true,
      },
    })

    if (!order) return reply.status(404).send({ success: false, message: 'Order tidak ditemukan' })
    return reply.send({ success: true, data: order })
  })

  // PUT /api/cms/orders/:id/status
  fastify.put('/:id/status', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status } = request.body as { status: string }

    if (!VALID_STATUSES.includes(status)) {
      return reply.status(400).send({ success: false, message: 'Status tidak valid' })
    }

    const order = await fastify.prisma.order.findUnique({ where: { id } })
    if (!order) return reply.status(404).send({ success: false, message: 'Order tidak ditemukan' })

    const updated = await fastify.prisma.order.update({
      where: { id },
      data: { status },
    })

    return reply.send({ success: true, data: updated })
  })
}
