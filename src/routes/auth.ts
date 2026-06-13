import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { authenticate } from '../middleware/authenticate'

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string }

    const user = await fastify.prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return reply.status(401).send({ success: false, message: 'Email atau password salah' })
    }

    const payload = { sub: user.id, email: user.email, role: user.role, type: 'user' as const }
    const accessToken = fastify.jwt.sign(payload, { expiresIn: '15m' })
    const refreshToken = crypto.randomBytes(40).toString('hex')

    await fastify.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        user_id: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return reply.send({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          institution: user.institution,
          city: user.city,
          created_at: user.created_at,
        },
      },
    })
  })

  fastify.post('/register', async (request, reply) => {
    const { full_name, email, password, phone, institution, city } = request.body as {
      full_name: string
      email: string
      password: string
      phone?: string
      institution?: string
      city?: string
    }

    if (!full_name || !email || !password) {
      return reply.status(400).send({ success: false, message: 'full_name, email, dan password wajib diisi' })
    }

    const existing = await fastify.prisma.user.findUnique({ where: { email } })
    if (existing) {
      return reply.status(409).send({ success: false, message: 'Email sudah terdaftar' })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await fastify.prisma.user.create({
      data: { full_name, email, password: hashed, phone, institution, city },
    })

    const payload = { sub: user.id, email: user.email, role: user.role, type: 'user' as const }
    const accessToken = fastify.jwt.sign(payload, { expiresIn: '15m' })
    const refreshToken = crypto.randomBytes(40).toString('hex')

    await fastify.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        user_id: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return reply.status(201).send({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          institution: user.institution,
          city: user.city,
          created_at: user.created_at,
        },
      },
    })
  })

  fastify.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string }

    const stored = await fastify.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!stored || stored.expires_at < new Date()) {
      if (stored) await fastify.prisma.refreshToken.delete({ where: { id: stored.id } })
      return reply.status(401).send({ success: false, message: 'Refresh token tidak valid atau kadaluarsa' })
    }

    const payload = {
      sub: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
      type: 'user' as const,
    }
    const newAccessToken = fastify.jwt.sign(payload, { expiresIn: '15m' })
    const newRefreshToken = crypto.randomBytes(40).toString('hex')

    await fastify.prisma.refreshToken.update({
      where: { id: stored.id },
      data: {
        token: newRefreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return reply.send({
      success: true,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    })
  })

  fastify.put('/me/password', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user
    if (user.type !== 'user') {
      return reply.status(403).send({ success: false, message: 'Forbidden' })
    }

    const { old_password, new_password } = request.body as {
      old_password: string
      new_password: string
    }

    const dbUser = await fastify.prisma.user.findUnique({ where: { id: user.sub } })
    if (!dbUser) return reply.status(404).send({ success: false, message: 'User tidak ditemukan' })

    if (!(await bcrypt.compare(old_password, dbUser.password))) {
      return reply.status(400).send({ success: false, message: 'Password lama salah' })
    }

    await fastify.prisma.user.update({
      where: { id: user.sub },
      data: { password: await bcrypt.hash(new_password, 12) },
    })

    await fastify.prisma.refreshToken.deleteMany({ where: { user_id: user.sub } })

    return reply.send({ success: true, message: 'Password berhasil diubah' })
  })
}
