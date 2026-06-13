import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate'
import { requireAdmin } from '../middleware/requireAdmin'

const PRO_PRICE = 89000

export default async function paymentRoutes(fastify: FastifyInstance) {
  fastify.post('/subscribe', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user
    if (user.type !== 'user') return reply.status(403).send({ success: false, message: 'Forbidden' })

    const { method } = request.body as { method?: string }

    const payment = await fastify.prisma.payment.create({
      data: {
        user_id: user.sub,
        amount: PRO_PRICE,
        tier: 'pro',
        status: 'success',
        method: method ?? 'QRIS',
        reference: `PAY-${Date.now()}`,
      },
    })

    await fastify.prisma.user.update({
      where: { id: user.sub },
      data: { subscription_tier: 'pro' },
    })

    return reply.status(201).send({ success: true, data: payment, message: 'Berhasil upgrade ke Pro' })
  })

  fastify.get('/history', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user
    if (user.type !== 'user') return reply.status(403).send({ success: false, message: 'Forbidden' })

    const { page = '1', limit = '10' } = request.query as { page?: string; limit?: string }
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [payments, total] = await Promise.all([
      fastify.prisma.payment.findMany({
        where: { user_id: user.sub },
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      fastify.prisma.payment.count({ where: { user_id: user.sub } }),
    ])

    return reply.send({ success: true, data: payments, total, page: parseInt(page), limit: parseInt(limit) })
  })

  fastify.get('/admin/all', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { page = '1', limit = '20', status } = request.query as {
      page?: string
      limit?: string
      status?: string
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where = status ? { status } : {}

    const [payments, total] = await Promise.all([
      fastify.prisma.payment.findMany({
        where,
        include: { user: { select: { id: true, username: true, email: true } } },
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      fastify.prisma.payment.count({ where }),
    ])

    return reply.send({ success: true, data: payments, total, page: parseInt(page), limit: parseInt(limit) })
  })
}
