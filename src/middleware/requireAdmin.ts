import { FastifyRequest, FastifyReply } from 'fastify'

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user
  if (user.type !== 'user' || user.role !== 'admin') {
    return reply.status(403).send({ success: false, message: 'Forbidden' })
  }
}
