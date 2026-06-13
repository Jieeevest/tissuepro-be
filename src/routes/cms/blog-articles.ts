import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireCmsAdmin } from '../../middleware/requireCmsAdmin'

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default async function cmsBlogArticleRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { page = '1', limit = '20', status, category, search, sort_by = 'created_at', sort_dir = 'desc' } = request.query as {
      page?: string
      limit?: string
      status?: string
      category?: string
      search?: string
      sort_by?: string
      sort_dir?: string
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (category) where.category = category
    if (search) where.title = { contains: search, mode: 'insensitive' }

    const validSortFields = ['title', 'created_at', 'status', 'category']
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at'
    const sortDir = sort_dir === 'asc' ? 'asc' : 'desc'

    const [articles, total] = await Promise.all([
      fastify.prisma.article.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip,
        take: parseInt(limit),
      }),
      fastify.prisma.article.count({ where }),
    ])

    return reply.send({ success: true, data: articles, total, page: parseInt(page), limit: parseInt(limit) })
  })

  fastify.get('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const article = await fastify.prisma.article.findUnique({ where: { id } })
    if (!article) return reply.status(404).send({ success: false, message: 'Artikel tidak ditemukan' })
    return reply.send({ success: true, data: article })
  })

  fastify.post('/', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const body = request.body as {
      title: string
      category: string
      content: string
      cover_url?: string
      author: string
      status?: string
    }

    const slug = toSlug(body.title)
    const existing = await fastify.prisma.article.findUnique({ where: { slug } })
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug

    const article = await fastify.prisma.article.create({
      data: {
        ...body,
        slug: finalSlug,
        status: body.status ?? 'draft',
        published_at: body.status === 'publish' ? new Date() : null,
      },
    })

    return reply.status(201).send({ success: true, data: article })
  })

  fastify.put('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as Partial<{
      title: string
      category: string
      content: string
      cover_url: string
      author: string
      status: string
    }>

    const current = await fastify.prisma.article.findUnique({ where: { id } })
    if (!current) return reply.status(404).send({ success: false, message: 'Artikel tidak ditemukan' })

    const publishedAt =
      body.status === 'publish' && current.status !== 'publish' ? new Date() : current.published_at

    const article = await fastify.prisma.article.update({
      where: { id },
      data: { ...body, published_at: publishedAt },
    })

    return reply.send({ success: true, data: article })
  })

  fastify.delete('/:id', { preHandler: [authenticate, requireCmsAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = await fastify.prisma.article.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Artikel tidak ditemukan' })

    await fastify.prisma.article.delete({ where: { id } })
    return reply.send({ success: true, message: 'Artikel berhasil dihapus' })
  })
}
