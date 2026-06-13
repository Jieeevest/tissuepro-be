import { FastifyInstance } from 'fastify'

export default async function publicRoutes(fastify: FastifyInstance) {
  fastify.post('/submit/inquiry', async (request, reply) => {
    const body = request.body as {
      name: string
      specialty: string
      clinic: string
      city: string
      whatsapp: string
      product_interest: string
      message: string
    }

    const required = ['name', 'specialty', 'clinic', 'city', 'whatsapp', 'product_interest', 'message'] as const
    for (const field of required) {
      if (!body[field] || !String(body[field]).trim()) {
        return reply.status(400).send({ success: false, message: `Field '${field}' wajib diisi` })
      }
    }

    if (!/^[\d+\-\s()]{6,20}$/.test(body.whatsapp.trim())) {
      return reply.status(400).send({ success: false, message: 'Format nomor WhatsApp tidak valid' })
    }

    const inquiry = await fastify.prisma.inquiry.create({
      data: {
        name: body.name.trim(),
        specialty: body.specialty.trim(),
        clinic: body.clinic.trim(),
        city: body.city.trim(),
        whatsapp: body.whatsapp.trim(),
        product_interest: body.product_interest.trim(),
        message: body.message.trim(),
      },
    })

    return reply.status(201).send({
      success: true,
      data: inquiry,
      message: 'Konsultasi berhasil dikirim. Tim kami akan segera menghubungi Anda.',
    })
  })
}
