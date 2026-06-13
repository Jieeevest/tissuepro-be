import { FastifyInstance } from 'fastify'
import MidtransClient from 'midtrans-client'
import { authenticate } from '../middleware/authenticate'

export default async function paymentRoutes(fastify: FastifyInstance) {
  const snap = new MidtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY ?? '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? '',
  })

  // POST /api/payments/initiate — buat Midtrans Snap token
  fastify.post('/initiate', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user.sub
    const { order_id } = request.body as { order_id: string }

    if (!order_id) {
      return reply.status(400).send({ success: false, message: 'order_id wajib diisi' })
    }

    const order = await fastify.prisma.order.findFirst({
      where: { id: order_id, user_id: userId },
      include: { items: true, order_payment: true, user: true },
    })

    if (!order) return reply.status(404).send({ success: false, message: 'Order tidak ditemukan' })
    if (order.status === 'paid') return reply.status(400).send({ success: false, message: 'Order sudah dibayar' })

    // Selalu buat transaksi baru — token lama bisa expired (24 jam)
    const midtransOrderId = `${order.order_number}-${Date.now()}`

    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: Math.round(Number(order.total_amount)),
      },
      item_details: order.items.map((item) => ({
        id: item.product_id,
        name: item.product_name,
        price: Math.round(Number(item.price)),
        quantity: item.quantity,
      })),
      customer_details: {
        first_name: order.shipping_name,
        phone: order.shipping_phone,
        email: order.user.email,
      },
      shipping_address: {
        first_name: order.shipping_name,
        phone: order.shipping_phone,
        address: order.shipping_address,
        city: order.shipping_city,
        postal_code: order.shipping_postal,
        country_code: 'IDN',
      },
    })

    await fastify.prisma.orderPayment.upsert({
      where: { order_id: order.id },
      update: {
        midtrans_order_id: midtransOrderId,
        snap_token: transaction.token,
        status: 'pending',
        amount: Number(order.total_amount),
      },
      create: {
        order_id: order.id,
        midtrans_order_id: midtransOrderId,
        snap_token: transaction.token,
        status: 'pending',
        amount: Number(order.total_amount),
      },
    })

    await fastify.prisma.order.update({
      where: { id: order.id },
      data: { status: 'awaiting_payment' },
    })

    return reply.send({ success: true, data: { snap_token: transaction.token } })
  })

  // POST /api/payments/notification — webhook dari Midtrans
  fastify.post('/notification', async (request, reply) => {
    const notification = request.body as Record<string, string>

    let statusResponse: Record<string, string>
    try {
      statusResponse = await snap.transaction.notification(notification)
    } catch {
      return reply.status(400).send({ success: false, message: 'Invalid notification' })
    }

    const { order_id: midtransOrderId, transaction_status, fraud_status, payment_type } = statusResponse

    const payment = await fastify.prisma.orderPayment.findUnique({
      where: { midtrans_order_id: midtransOrderId },
    })
    if (!payment) return reply.status(404).send({ success: false, message: 'Payment tidak ditemukan' })

    let paymentStatus = 'pending'
    let orderStatus = 'awaiting_payment'

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') { paymentStatus = 'success'; orderStatus = 'paid' }
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'success'; orderStatus = 'paid'
    } else if (transaction_status === 'cancel' || transaction_status === 'deny') {
      paymentStatus = 'failed'; orderStatus = 'pending'
    } else if (transaction_status === 'expire') {
      paymentStatus = 'expired'; orderStatus = 'pending'
    }

    await fastify.prisma.orderPayment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        payment_method: payment_type,
        midtrans_response: statusResponse as object,
      },
    })

    await fastify.prisma.order.update({
      where: { id: payment.order_id },
      data: { status: orderStatus },
    })

    return reply.send({ success: true })
  })
}
