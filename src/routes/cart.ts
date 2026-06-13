import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate'

export default async function cartRoutes(fastify: FastifyInstance) {
  const preHandler = [authenticate]

  // GET /api/cart — ambil cart beserta items
  fastify.get('/', { preHandler }, async (request, reply) => {
    const userId = request.user.sub

    const cart = await fastify.prisma.cart.findUnique({
      where: { user_id: userId },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, series: true, price: true, image_url: true, status: true } } },
          orderBy: { created_at: 'asc' },
        },
      },
    })

    if (!cart) {
      return reply.send({ success: true, data: { items: [], total: 0 } })
    }

    const total = cart.items.reduce((sum, item) => {
      const price = Number(item.product.price ?? 0)
      return sum + price * item.quantity
    }, 0)

    return reply.send({ success: true, data: { id: cart.id, items: cart.items, total } })
  })

  // POST /api/cart/items — tambah atau update qty item
  fastify.post('/items', { preHandler }, async (request, reply) => {
    const userId = request.user.sub
    const { product_id, quantity = 1 } = request.body as { product_id: string; quantity?: number }

    if (!product_id) {
      return reply.status(400).send({ success: false, message: 'product_id wajib diisi' })
    }
    if (quantity < 1) {
      return reply.status(400).send({ success: false, message: 'quantity minimal 1' })
    }

    const product = await fastify.prisma.product.findUnique({ where: { id: product_id } })
    if (!product || product.status !== 'aktif') {
      return reply.status(404).send({ success: false, message: 'Produk tidak ditemukan' })
    }

    let cart = await fastify.prisma.cart.findUnique({ where: { user_id: userId } })
    if (!cart) {
      cart = await fastify.prisma.cart.create({ data: { user_id: userId } })
    }

    const existing = await fastify.prisma.cartItem.findUnique({
      where: { cart_id_product_id: { cart_id: cart.id, product_id } },
    })

    if (existing) {
      await fastify.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      })
    } else {
      await fastify.prisma.cartItem.create({
        data: { cart_id: cart.id, product_id, quantity },
      })
    }

    return reply.send({ success: true, message: 'Produk ditambahkan ke keranjang' })
  })

  // PUT /api/cart/items/:id — update quantity
  fastify.put('/items/:id', { preHandler }, async (request, reply) => {
    const userId = request.user.sub
    const { id } = request.params as { id: string }
    const { quantity } = request.body as { quantity: number }

    if (!quantity || quantity < 1) {
      return reply.status(400).send({ success: false, message: 'quantity minimal 1' })
    }

    const item = await fastify.prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    })
    if (!item || item.cart.user_id !== userId) {
      return reply.status(404).send({ success: false, message: 'Item tidak ditemukan' })
    }

    await fastify.prisma.cartItem.update({ where: { id }, data: { quantity } })
    return reply.send({ success: true, message: 'Quantity diperbarui' })
  })

  // DELETE /api/cart/items/:id — hapus item dari cart
  fastify.delete('/items/:id', { preHandler }, async (request, reply) => {
    const userId = request.user.sub
    const { id } = request.params as { id: string }

    const item = await fastify.prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    })
    if (!item || item.cart.user_id !== userId) {
      return reply.status(404).send({ success: false, message: 'Item tidak ditemukan' })
    }

    await fastify.prisma.cartItem.delete({ where: { id } })
    return reply.send({ success: true, message: 'Item dihapus dari keranjang' })
  })

  // DELETE /api/cart — kosongkan seluruh cart
  fastify.delete('/', { preHandler }, async (request, reply) => {
    const userId = request.user.sub
    const cart = await fastify.prisma.cart.findUnique({ where: { user_id: userId } })
    if (cart) {
      await fastify.prisma.cartItem.deleteMany({ where: { cart_id: cart.id } })
    }
    return reply.send({ success: true, message: 'Keranjang dikosongkan' })
  })
}
