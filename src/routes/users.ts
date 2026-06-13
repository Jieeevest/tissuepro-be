import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { authenticate } from '../middleware/authenticate'
import { requireAdmin } from '../middleware/requireAdmin'

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user
    if (user.type !== 'user') return reply.status(403).send({ success: false, message: 'Forbidden' })

    const dbUser = await fastify.prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, username: true, email: true, role: true, subscription_tier: true, created_at: true },
    })
    if (!dbUser) return reply.status(404).send({ success: false, message: 'User tidak ditemukan' })

    return reply.send({ success: true, data: dbUser })
  })

  fastify.put('/profile', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user
    if (user.type !== 'user') return reply.status(403).send({ success: false, message: 'Forbidden' })

    const { username, email } = request.body as { username?: string; email?: string }

    if (username || email) {
      const conflict = await fastify.prisma.user.findFirst({
        where: {
          OR: [
            ...(username ? [{ username }] : []),
            ...(email ? [{ email }] : []),
          ],
          NOT: { id: user.sub },
        },
      })
      if (conflict) {
        return reply.status(409).send({ success: false, message: 'Username atau email sudah digunakan' })
      }
    }

    const updated = await fastify.prisma.user.update({
      where: { id: user.sub },
      data: {
        ...(username && { username }),
        ...(email && { email }),
      },
      select: { id: true, username: true, email: true, role: true, subscription_tier: true, created_at: true },
    })

    return reply.send({ success: true, data: updated })
  })

  fastify.get('/me/subscription', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user
    if (user.type !== 'user') return reply.status(403).send({ success: false, message: 'Forbidden' })

    const dbUser = await fastify.prisma.user.findUnique({
      where: { id: user.sub },
      select: { subscription_tier: true },
    })

    return reply.send({ success: true, data: { tier: dbUser?.subscription_tier ?? 'starter' } })
  })

  fastify.get('/stats', { preHandler: [authenticate, requireAdmin] }, async (_request, reply) => {
    const [total, pro, starter] = await Promise.all([
      fastify.prisma.user.count({ where: { role: 'user' } }),
      fastify.prisma.user.count({ where: { role: 'user', subscription_tier: 'pro' } }),
      fastify.prisma.user.count({ where: { role: 'user', subscription_tier: 'starter' } }),
    ])

    return reply.send({ success: true, data: { total, pro, starter } })
  })

  fastify.get('/', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { page = '1', limit = '20', search, sort_by = 'created_at', sort_dir = 'desc', role = 'user' } = request.query as {
      page?: string
      limit?: string
      search?: string
      sort_by?: string
      sort_dir?: string
      role?: string
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const roleFilter = role === 'admin'
      ? { in: ['admin', 'superadmin'] }
      : { equals: 'user' }
    const where = search
      ? { role: roleFilter, OR: [{ username: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
      : { role: roleFilter }

    const validSortFields = ['username', 'email', 'created_at', 'subscription_tier']
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at'
    const sortDir = sort_dir === 'asc' ? 'asc' : 'desc'

    const [users, total] = await Promise.all([
      fastify.prisma.user.findMany({
        where,
        select: { id: true, username: true, email: true, role: true, subscription_tier: true, created_at: true },
        orderBy: { [sortField]: sortDir },
        skip,
        take: parseInt(limit),
      }),
      fastify.prisma.user.count({ where }),
    ])

    return reply.send({ success: true, data: users, total, page: parseInt(page), limit: parseInt(limit) })
  })

  fastify.delete('/:id', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    if (id === request.user.sub) {
      return reply.status(400).send({ success: false, message: 'Tidak bisa menghapus akun sendiri' })
    }

    const target = await fastify.prisma.user.findUnique({ where: { id } })
    if (!target) return reply.status(404).send({ success: false, message: 'User tidak ditemukan' })

    await fastify.prisma.user.delete({ where: { id } })
    return reply.send({ success: true, message: 'User berhasil dihapus' })
  })

  fastify.patch('/:id/role', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { role } = request.body as { role: string }

    if (!['user', 'admin', 'superadmin'].includes(role)) {
      return reply.status(400).send({ success: false, message: 'Role tidak valid' })
    }

    const target = await fastify.prisma.user.findUnique({ where: { id } })
    if (!target) return reply.status(404).send({ success: false, message: 'User tidak ditemukan' })

    const updated = await fastify.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, username: true, email: true, role: true },
    })

    return reply.send({ success: true, data: updated })
  })

  fastify.post('/', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { username, email, password, subscription_tier = 'starter', role: userRole = 'user' } = request.body as {
      username: string
      email: string
      password: string
      subscription_tier?: string
      role?: string
    }

    const existing = await fastify.prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    })
    if (existing) {
      return reply.status(409).send({ success: false, message: 'Username atau email sudah terdaftar' })
    }

    const validRole = ['admin', 'superadmin'].includes(userRole) ? userRole : 'user'
    const hashed = await bcrypt.hash(password, 12)
    const user = await fastify.prisma.user.create({
      data: { username, email, password: hashed, subscription_tier, role: validRole },
      select: { id: true, username: true, email: true, role: true, subscription_tier: true, created_at: true },
    })

    return reply.status(201).send({ success: true, data: user })
  })

  fastify.patch('/:id/tier', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { tier } = request.body as { tier: string }

    if (!tier || !tier.trim()) {
      return reply.status(400).send({ success: false, message: 'Tipe klien tidak boleh kosong' })
    }

    const target = await fastify.prisma.user.findUnique({ where: { id } })
    if (!target) return reply.status(404).send({ success: false, message: 'User tidak ditemukan' })

    const updated = await fastify.prisma.user.update({
      where: { id },
      data: { subscription_tier: tier.trim() },
      select: { id: true, username: true, email: true, role: true, subscription_tier: true, created_at: true },
    })

    return reply.send({ success: true, data: updated })
  })
}
