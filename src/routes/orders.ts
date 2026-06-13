import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate'

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `TP-${ts}-${rand}`
}

export default async function orderRoutes(fastify: FastifyInstance) {
  const preHandler = [authenticate]

  // POST /api/orders — buat order dari cart
  fastify.post('/', { preHandler }, async (request, reply) => {
    const userId = request.user.sub
    const { shipping_name, shipping_phone, shipping_address, shipping_city, shipping_province, shipping_postal, notes } =
      request.body as {
        shipping_name: string
        shipping_phone: string
        shipping_address: string
        shipping_city: string
        shipping_province: string
        shipping_postal: string
        notes?: string
      }

    if (!shipping_name || !shipping_phone || !shipping_address || !shipping_city || !shipping_province || !shipping_postal) {
      return reply.status(400).send({ success: false, message: 'Data pengiriman tidak lengkap' })
    }

    const cart = await fastify.prisma.cart.findUnique({
      where: { user_id: userId },
      include: { items: { include: { product: true } } },
    })

    if (!cart || cart.items.length === 0) {
      return reply.status(400).send({ success: false, message: 'Keranjang kosong' })
    }

    const itemsWithPrice = cart.items.filter((i) => i.product.price !== null)
    if (itemsWithPrice.length !== cart.items.length) {
      return reply.status(400).send({ success: false, message: 'Beberapa produk belum memiliki harga' })
    }

    const total_amount = cart.items.reduce((sum, i) => sum + Number(i.product.price!) * i.quantity, 0)

    const order = await fastify.prisma.order.create({
      data: {
        order_number: generateOrderNumber(),
        user_id: userId,
        status: 'pending',
        total_amount,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_province,
        shipping_postal,
        notes,
        items: {
          create: cart.items.map((i) => ({
            product_id: i.product_id,
            product_name: i.product.name,
            price: Number(i.product.price!),
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    })

    // Kosongkan cart setelah order dibuat
    await fastify.prisma.cartItem.deleteMany({ where: { cart_id: cart.id } })

    return reply.status(201).send({ success: true, data: order })
  })

  // GET /api/orders — riwayat order customer
  fastify.get('/', { preHandler }, async (request, reply) => {
    const userId = request.user.sub
    const orders = await fastify.prisma.order.findMany({
      where: { user_id: userId },
      include: {
        items: true,
        order_payment: { select: { status: true, payment_method: true } },
      },
      orderBy: { created_at: 'desc' },
    })
    return reply.send({ success: true, data: orders })
  })

  // GET /api/orders/:id — detail order
  fastify.get('/:id', { preHandler }, async (request, reply) => {
    const userId = request.user.sub
    const { id } = request.params as { id: string }

    const order = await fastify.prisma.order.findFirst({
      where: { id, user_id: userId },
      include: {
        items: { include: { product: { select: { id: true, name: true, image_url: true } } } },
        order_payment: true,
      },
    })

    if (!order) return reply.status(404).send({ success: false, message: 'Order tidak ditemukan' })
    return reply.send({ success: true, data: order })
  })
}
