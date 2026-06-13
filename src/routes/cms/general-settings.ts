import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireCmsAdmin } from '../../middleware/requireCmsAdmin'

export default async function cmsGeneralSettingsRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate, requireCmsAdmin] }, async (_request, reply) => {
    const settings = await fastify.prisma.generalSetting.findMany()

    const map = settings.reduce<Record<string, string>>((acc, s) => {
      acc[s.key] = s.value
      return acc
    }, {})

    return reply.send({ success: true, data: map })
  })

  fastify.put('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const settings = request.body as Record<string, string>

    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        fastify.prisma.generalSetting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        })
      )
    )

    return reply.send({ success: true, message: 'Pengaturan umum berhasil disimpan' })
  })
}
