import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireCmsAdmin } from '../../middleware/requireCmsAdmin'

const PAID_STATUSES = ['paid', 'processing', 'shipped', 'delivered']

export default async function cmsDashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/stats', { preHandler: [authenticate, requireCmsAdmin] }, async (_request, reply) => {
    const now = new Date()

    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const [
      totalInquiries,
      newInquiries,
      activeProducts,
      publishedArticles,
      recentInquiries,
      revenueToday,
      revenueWeek,
      revenueMonth,
      revenueTotal,
      ordersToday,
      pendingOrders,
      recentOrders,
    ] = await Promise.all([
      fastify.prisma.inquiry.count(),
      fastify.prisma.inquiry.count({ where: { status: 'baru' } }),
      fastify.prisma.product.count({ where: { status: 'aktif' } }),
      fastify.prisma.article.count({ where: { is_published: true } }),
      fastify.prisma.inquiry.findMany({
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
      fastify.prisma.order.aggregate({
        where: { status: { in: PAID_STATUSES }, created_at: { gte: today } },
        _sum: { total_amount: true },
      }),
      fastify.prisma.order.aggregate({
        where: { status: { in: PAID_STATUSES }, created_at: { gte: weekStart } },
        _sum: { total_amount: true },
      }),
      fastify.prisma.order.aggregate({
        where: { status: { in: PAID_STATUSES }, created_at: { gte: monthStart } },
        _sum: { total_amount: true },
      }),
      fastify.prisma.order.aggregate({
        where: { status: { in: PAID_STATUSES } },
        _sum: { total_amount: true },
      }),
      fastify.prisma.order.count({ where: { created_at: { gte: today } } }),
      fastify.prisma.order.count({ where: { status: { in: ['pending', 'awaiting_payment', 'paid'] } } }),
      fastify.prisma.order.findMany({
        orderBy: { created_at: 'desc' },
        take: 5,
        include: {
          user: { select: { full_name: true, email: true } },
          items: { select: { product_name: true, quantity: true } },
        },
      }),
    ])

    return reply.send({
      success: true,
      data: {
        total_inquiries: totalInquiries,
        new_inquiries: newInquiries,
        active_products: activeProducts,
        published_articles: publishedArticles,
        recent_inquiries: recentInquiries,
        revenue_today:   Number(revenueToday._sum.total_amount  ?? 0),
        revenue_week:    Number(revenueWeek._sum.total_amount   ?? 0),
        revenue_month:   Number(revenueMonth._sum.total_amount  ?? 0),
        revenue_total:   Number(revenueTotal._sum.total_amount  ?? 0),
        orders_today:    ordersToday,
        pending_orders:  pendingOrders,
        recent_orders:   recentOrders,
      },
    })
  })
}
