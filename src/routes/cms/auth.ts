import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { authenticate } from '../../middleware/authenticate'
import { requireCmsAdmin } from '../../middleware/requireCmsAdmin'

export default async function cmsAuthRoutes(fastify: FastifyInstance) {
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string }

    const admin = await fastify.prisma.adminUser.findUnique({ where: { email } })
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return reply.status(401).send({ success: false, message: 'Email atau password salah' })
    }

    const payload = { sub: admin.id, email: admin.email, role: admin.role, type: 'cms_admin' as const }
    const accessToken = fastify.jwt.sign(payload, { expiresIn: '8h' })
    const refreshToken = crypto.randomBytes(40).toString('hex')

    await fastify.prisma.adminRefreshToken.create({
      data: {
        token: refreshToken,
        admin_id: admin.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    return reply.send({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      },
    })
  })

  fastify.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string }

    const stored = await fastify.prisma.adminRefreshToken.findUnique({
      where: { token: refreshToken },
      include: { admin: true },
    })

    if (!stored || stored.expires_at < new Date()) {
      if (stored) await fastify.prisma.adminRefreshToken.delete({ where: { id: stored.id } })
      return reply.status(401).send({ success: false, message: 'Refresh token tidak valid atau kadaluarsa' })
    }

    const payload = {
      sub: stored.admin.id,
      email: stored.admin.email,
      role: stored.admin.role,
      type: 'cms_admin' as const,
    }
    const newAccessToken = fastify.jwt.sign(payload, { expiresIn: '8h' })
    const newRefreshToken = crypto.randomBytes(40).toString('hex')

    await fastify.prisma.adminRefreshToken.update({
      where: { id: stored.id },
      data: {
        token: newRefreshToken,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    return reply.send({
      success: true,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    })
  })

  fastify.get('/me', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const admin = await fastify.prisma.adminUser.findUnique({
      where: { id: request.user.sub },
      select: { id: true, name: true, email: true, role: true, created_at: true },
    })
    if (!admin) return reply.status(404).send({ success: false, message: 'Admin tidak ditemukan' })
    return reply.send({ success: true, data: admin })
  })
}
