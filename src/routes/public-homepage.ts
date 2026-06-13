import { FastifyInstance } from 'fastify'

export default async function publicHomepageRoutes(fastify: FastifyInstance) {
  fastify.get('/products', async (_request, reply) => {
    const products = await fastify.prisma.product.findMany({
      where: { status: 'aktif' },
      orderBy: [{ series: 'asc' }, { order: 'asc' }],
    })
    return reply.send({ success: true, data: products })
  })

  fastify.get('/pipeline', async (_request, reply) => {
    const items = await fastify.prisma.pipelineItem.findMany({
      orderBy: [{ stage: 'asc' }, { order: 'asc' }],
    })
    return reply.send({ success: true, data: items })
  })

  fastify.get('/case-studies', async (_request, reply) => {
    const studies = await fastify.prisma.caseStudy.findMany({
      where: { is_published: true },
      include: {
        images: { orderBy: { order: 'asc' } },
        metrics: { orderBy: { order: 'asc' } },
      },
      orderBy: { created_at: 'asc' },
    })
    return reply.send({ success: true, data: studies })
  })

  fastify.get('/application-areas', async (_request, reply) => {
    const areas = await fastify.prisma.applicationArea.findMany({
      where: { is_active: true },
      orderBy: { order: 'asc' },
    })
    return reply.send({ success: true, data: areas })
  })
}
