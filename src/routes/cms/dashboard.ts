import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireCmsAdmin } from '../../middleware/requireCmsAdmin'

export default async function cmsDashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/stats', { preHandler: [authenticate, requireCmsAdmin] }, async (_request, reply) => {
    const [
      totalInquiries,
      newInquiries,
      totalProducts,
      totalCaseStudies,
      totalArticles,
      totalPipeline,
      recentInquiries,
    ] = await Promise.all([
      fastify.prisma.inquiry.count(),
      fastify.prisma.inquiry.count({ where: { status: 'baru' } }),
      fastify.prisma.product.count(),
      fastify.prisma.caseStudy.count(),
      fastify.prisma.article.count(),
      fastify.prisma.pipelineItem.count(),
      fastify.prisma.inquiry.findMany({
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
    ])

    return reply.send({
      success: true,
      data: {
        total_inquiries: totalInquiries,
        new_inquiries: newInquiries,
        total_products: totalProducts,
        total_case_studies: totalCaseStudies,
        total_articles: totalArticles,
        total_pipeline: totalPipeline,
        recent_inquiries: recentInquiries,
      },
    })
  })
}
