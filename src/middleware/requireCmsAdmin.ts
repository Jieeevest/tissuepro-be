import { FastifyRequest, FastifyReply } from 'fastify'

export async function requireCmsAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user
  const isUserAdmin = user.type === 'user' && user.role === 'admin'
  const isCmsAdmin  = user.type === 'cms_admin'
  if (!isUserAdmin && !isCmsAdmin) {
    return reply.status(403).send({ success: false, message: 'Forbidden' })
  }
}
