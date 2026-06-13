import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireCmsAdmin } from '../../middleware/requireCmsAdmin'

export default async function cmsPageSettingsRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { page } = request.query as { page?: string }
    const where = page ? { page } : {}

    const settings = await fastify.prisma.pageSetting.findMany({ where })

    const grouped = settings.reduce<Record<string, Record<string, string>>>((acc, s) => {
      if (!acc[s.page]) acc[s.page] = {}
      acc[s.page][s.key] = s.value
      return acc
    }, {})

    return reply.send({ success: true, data: page ? (grouped[page] ?? {}) : grouped })
  })

  fastify.put('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { page, settings } = request.body as {
      page: string
      settings: Record<string, string>
    }

    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        fastify.prisma.pageSetting.upsert({
          where: { page_key: { page, key } },
          create: { page, key, value },
          update: { value },
        })
      )
    )

    return reply.send({ success: true, message: 'Pengaturan halaman berhasil disimpan' })
  })
}
