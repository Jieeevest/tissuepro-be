import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate'
import { requireAdmin } from '../middleware/requireAdmin'

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default async function articleRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    const { page = '1', limit = '10', category, search } = request.query as {
      page?: string
      limit?: string
      category?: string
      search?: string
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where: Record<string, unknown> = { status: 'publish' }
    if (category) where.category = category
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [articles, total] = await Promise.all([
      fastify.prisma.article.findMany({
        where,
        select: { id: true, title: true, slug: true, category: true, cover_url: true, author: true, published_at: true },
        orderBy: { published_at: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      fastify.prisma.article.count({ where }),
    ])

    return reply.send({ success: true, data: articles, total, page: parseInt(page), limit: parseInt(limit) })
  })

  fastify.get('/:slugOrId', async (request, reply) => {
    const { slugOrId } = request.params as { slugOrId: string }

    const article = await fastify.prisma.article.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
        status: 'publish',
      },
    })

    if (!article) return reply.status(404).send({ success: false, message: 'Artikel tidak ditemukan' })
    return reply.send({ success: true, data: article })
  })

  fastify.get('/admin/all', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { page = '1', limit = '20', status, category } = request.query as {
      page?: string
      limit?: string
      status?: string
      category?: string
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (category) where.category = category

    const [articles, total] = await Promise.all([
      fastify.prisma.article.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      fastify.prisma.article.count({ where }),
    ])

    return reply.send({ success: true, data: articles, total, page: parseInt(page), limit: parseInt(limit) })
  })

  fastify.post('/', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
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

  fastify.put('/:id', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as {
      title?: string
      category?: string
      content?: string
      cover_url?: string
      author?: string
      status?: string
    }

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

  fastify.delete('/:id', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const existing = await fastify.prisma.article.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ success: false, message: 'Artikel tidak ditemukan' })

    await fastify.prisma.article.delete({ where: { id } })
    return reply.send({ success: true, message: 'Artikel berhasil dihapus' })
  })
}
