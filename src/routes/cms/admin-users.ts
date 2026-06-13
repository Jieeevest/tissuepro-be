import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { authenticate } from '../../middleware/authenticate'
import { requireCmsAdmin } from '../../middleware/requireCmsAdmin'

export default async function cmsAdminUserRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    if (request.user.role !== 'super-admin') {
      return reply.status(403).send({ success: false, message: 'Hanya super-admin yang bisa melihat daftar admin' })
    }

    const admins = await fastify.prisma.adminUser.findMany({
      select: { id: true, name: true, email: true, role: true, created_at: true },
      orderBy: { created_at: 'desc' },
    })

    return reply.send({ success: true, data: admins })
  })

  fastify.get('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    if (request.user.role !== 'super-admin') {
      return reply.status(403).send({ success: false, message: 'Forbidden' })
    }

    const { id } = request.params as { id: string }
    const admin = await fastify.prisma.adminUser.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, created_at: true },
    })
    if (!admin) return reply.status(404).send({ success: false, message: 'Admin tidak ditemukan' })
    return reply.send({ success: true, data: admin })
  })

  fastify.post('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    if (request.user.role !== 'super-admin') {
      return reply.status(403).send({ success: false, message: 'Hanya super-admin yang bisa membuat admin baru' })
    }

    const { name, email, password, role } = request.body as {
      name: string
      email: string
      password: string
      role?: string
    }

    const existing = await fastify.prisma.adminUser.findUnique({ where: { email } })
    if (existing) return reply.status(409).send({ success: false, message: 'Email sudah terdaftar' })

    const hashed = await bcrypt.hash(password, 12)
    const admin = await fastify.prisma.adminUser.create({
      data: { name, email, password: hashed, role: role ?? 'editor' },
      select: { id: true, name: true, email: true, role: true, created_at: true },
    })

    return reply.status(201).send({ success: true, data: admin })
  })

  fastify.put('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    if (request.user.role !== 'super-admin') {
      return reply.status(403).send({ success: false, message: 'Forbidden' })
    }

    const { id } = request.params as { id: string }
    const { name, role, password } = request.body as {
      name?: string
      role?: string
      password?: string
    }

    const existing = await fastify.prisma.adminUser.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Admin tidak ditemukan' })

    const data: Record<string, unknown> = {}
    if (name) data.name = name
    if (role) data.role = role
    if (password) data.password = await bcrypt.hash(password, 12)

    const admin = await fastify.prisma.adminUser.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, created_at: true },
    })

    return reply.send({ success: true, data: admin })
  })

  fastify.delete('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    if (request.user.role !== 'super-admin') {
      return reply.status(403).send({ success: false, message: 'Forbidden' })
    }
    const { id } = request.params as { id: string }
    if (request.user.sub === id) {
      return reply.status(400).send({ success: false, message: 'Tidak bisa menghapus akun sendiri' })
    }
    const existing = await fastify.prisma.adminUser.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Admin tidak ditemukan' })

    await fastify.prisma.adminUser.delete({ where: { id } })
    return reply.send({ success: true, message: 'Admin berhasil dihapus' })
  })
}
