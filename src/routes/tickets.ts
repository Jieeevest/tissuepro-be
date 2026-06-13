import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate'
import { requireAdmin } from '../middleware/requireAdmin'

export default async function ticketRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user
    if (user.type !== 'user') return reply.status(403).send({ success: false, message: 'Forbidden' })

    const tickets = await fastify.prisma.ticket.findMany({
      where: { user_id: user.sub },
      orderBy: { created_at: 'desc' },
      include: { replies: { orderBy: { created_at: 'asc' } } },
    })

    return reply.send({ success: true, data: tickets })
  })

  fastify.get('/admin/all', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { page = '1', limit = '20', status } = request.query as {
      page?: string
      limit?: string
      status?: string
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where = status ? { status } : {}

    const [tickets, total] = await Promise.all([
      fastify.prisma.ticket.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, email: true } },
          replies: { orderBy: { created_at: 'asc' } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      fastify.prisma.ticket.count({ where }),
    ])

    return reply.send({ success: true, data: tickets, total, page: parseInt(page), limit: parseInt(limit) })
  })

  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user
    const { id } = request.params as { id: string }
    if (user.type !== 'user') return reply.status(403).send({ success: false, message: 'Forbidden' })

    const ticket = await fastify.prisma.ticket.findFirst({
      where: { id, ...(user.role !== 'admin' ? { user_id: user.sub } : {}) },
      include: { replies: { orderBy: { created_at: 'asc' } } },
    })

    if (!ticket) return reply.status(404).send({ success: false, message: 'Ticket tidak ditemukan' })
    return reply.send({ success: true, data: ticket })
  })

  fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user
    if (user.type !== 'user') return reply.status(403).send({ success: false, message: 'Forbidden' })

    const { subject, category, message } = request.body as {
      subject: string
      category: string
      message: string
    }

    const ticket = await fastify.prisma.ticket.create({
      data: { user_id: user.sub, subject, category, message },
    })

    return reply.status(201).send({ success: true, data: ticket })
  })

  fastify.post('/:id/reply', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user
    const { id } = request.params as { id: string }
    if (user.type !== 'user') return reply.status(403).send({ success: false, message: 'Forbidden' })

    const ticket = await fastify.prisma.ticket.findFirst({
      where: { id, ...(user.role !== 'admin' ? { user_id: user.sub } : {}) },
    })
    if (!ticket) return reply.status(404).send({ success: false, message: 'Ticket tidak ditemukan' })

    const { message } = request.body as { message: string }
    const isAdmin = user.role === 'admin'

    const reply_ = await fastify.prisma.ticketReply.create({
      data: {
        ticket_id: id,
        user_id: user.sub,
        message,
        is_admin: isAdmin,
      },
    })

    if (isAdmin && ticket.status === 'open') {
      await fastify.prisma.ticket.update({
        where: { id },
        data: { status: 'in_progress' },
      })
    }

    return reply.status(201).send({ success: true, data: reply_ })
  })

  fastify.patch('/:id/status', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status } = request.body as { status: string }

    const valid = ['open', 'in_progress', 'resolved', 'closed']
    if (!valid.includes(status)) {
      return reply.status(400).send({ success: false, message: 'Status tidak valid' })
    }

    const existing = await fastify.prisma.ticket.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Ticket tidak ditemukan' })

    const ticket = await fastify.prisma.ticket.update({
      where: { id },
      data: { status },
    })

    return reply.send({ success: true, data: ticket })
  })
}
