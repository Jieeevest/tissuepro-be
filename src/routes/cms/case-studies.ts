import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireCmsAdmin } from '../../middleware/requireCmsAdmin'

export default async function cmsCaseStudyRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { page = '1', limit = '20', specialty, search, is_published, sort_by = 'created_at', sort_dir = 'desc' } = request.query as {
      page?: string
      limit?: string
      specialty?: string
      search?: string
      is_published?: string
      sort_by?: string
      sort_dir?: string
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where: Record<string, unknown> = {}
    if (specialty) where.specialty = specialty
    if (search) where.title = { contains: search, mode: 'insensitive' }
    if (is_published === 'true') where.is_published = true
    if (is_published === 'false') where.is_published = false

    const validSortFields = ['title', 'specialty', 'created_at']
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at'
    const sortDir = sort_dir === 'asc' ? 'asc' : 'desc'

    const [studies, total] = await Promise.all([
      fastify.prisma.caseStudy.findMany({
        where,
        include: { images: { orderBy: { order: 'asc' } }, metrics: { orderBy: { order: 'asc' } } },
        orderBy: { [sortField]: sortDir },
        skip,
        take: parseInt(limit),
      }),
      fastify.prisma.caseStudy.count({ where }),
    ])

    return reply.send({ success: true, data: studies, total, page: parseInt(page), limit: parseInt(limit) })
  })

  fastify.get('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const study = await fastify.prisma.caseStudy.findUnique({
      where: { id },
      include: { images: { orderBy: { order: 'asc' } }, metrics: { orderBy: { order: 'asc' } } },
    })
    if (!study) return reply.status(404).send({ success: false, message: 'Case study tidak ditemukan' })
    return reply.send({ success: true, data: study })
  })

  fastify.post('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const body = request.body as {
      specialty: string
      title: string
      patient_description: string
      disclaimer: string
      is_published?: boolean
      images?: { src: string; caption: string; order?: number }[]
      metrics?: { label: string; value: string; order?: number }[]
    }

    const { images, metrics, ...data } = body

    const study = await fastify.prisma.caseStudy.create({
      data: {
        ...data,
        ...(images?.length && {
          images: { create: images.map((img, i) => ({ ...img, order: img.order ?? i })) },
        }),
        ...(metrics?.length && {
          metrics: { create: metrics.map((m, i) => ({ ...m, order: m.order ?? i })) },
        }),
      },
      include: { images: true, metrics: true },
    })

    return reply.status(201).send({ success: true, data: study })
  })

  fastify.put('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as {
      specialty?: string
      title?: string
      patient_description?: string
      disclaimer?: string
      is_published?: boolean
      images?: { src: string; caption: string; order?: number }[]
      metrics?: { label: string; value: string; order?: number }[]
    }

    const existing = await fastify.prisma.caseStudy.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Case study tidak ditemukan' })

    const { images, metrics, ...data } = body

    await fastify.prisma.$transaction(async (tx) => {
      if (images !== undefined) {
        await tx.caseStudyImage.deleteMany({ where: { case_study_id: id } })
        if (images.length) {
          await tx.caseStudyImage.createMany({
            data: images.map((img, i) => ({ ...img, case_study_id: id, order: img.order ?? i })),
          })
        }
      }
      if (metrics !== undefined) {
        await tx.caseStudyMetric.deleteMany({ where: { case_study_id: id } })
        if (metrics.length) {
          await tx.caseStudyMetric.createMany({
            data: metrics.map((m, i) => ({ ...m, case_study_id: id, order: m.order ?? i })),
          })
        }
      }
      await tx.caseStudy.update({ where: { id }, data })
    })

    const study = await fastify.prisma.caseStudy.findUnique({
      where: { id },
      include: { images: { orderBy: { order: 'asc' } }, metrics: { orderBy: { order: 'asc' } } },
    })

    return reply.send({ success: true, data: study })
  })

  fastify.delete('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = await fastify.prisma.caseStudy.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Case study tidak ditemukan' })

    await fastify.prisma.caseStudy.delete({ where: { id } })
    return reply.send({ success: true, message: 'Case study berhasil dihapus' })
  })
}
