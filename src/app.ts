import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'

import prismaPlugin from './plugins/prisma'

import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import articleRoutes from './routes/articles'
import ticketRoutes from './routes/tickets'
import paymentRoutes from './routes/payment'
import publicRoutes from './routes/public'
import publicHomepageRoutes from './routes/public-homepage'

import cartRoutes from './routes/cart'
import orderRoutes from './routes/orders'
import paymentRoutes2 from './routes/payments'
import cmsOrderRoutes from './routes/cms/orders'

import cmsAuthRoutes from './routes/cms/auth'
import cmsDashboardRoutes from './routes/cms/dashboard'
import cmsInquiryRoutes from './routes/cms/inquiries'
import cmsProductRoutes from './routes/cms/products'
import cmsPipelineRoutes from './routes/cms/pipeline'
import cmsCaseStudyRoutes from './routes/cms/case-studies'
import cmsApplicationAreaRoutes from './routes/cms/application-areas'
import cmsDocumentRoutes from './routes/cms/documents'
import cmsBlogArticleRoutes from './routes/cms/blog-articles'
import cmsAdminUserRoutes from './routes/cms/admin-users'
import cmsPageSettingsRoutes from './routes/cms/page-settings'
import cmsGeneralSettingsRoutes from './routes/cms/general-settings'
import cmsMediaRoutes from './routes/cms/media'

export function buildApp() {
  const app = Fastify({ logger: true })

  app.register(helmet, { contentSecurityPolicy: false })
  app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB
  app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? '*',
    credentials: true,
  })
  app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'fallback-secret-change-me',
  })

  app.register(prismaPlugin)

  // Public
  app.register(publicRoutes, { prefix: '/api' })
  app.register(publicHomepageRoutes, { prefix: '/api/public' })

  // App auth & features
  app.register(authRoutes, { prefix: '/api/auth' })
  app.register(userRoutes, { prefix: '/api/users' })
  app.register(articleRoutes, { prefix: '/api/articles' })
  app.register(ticketRoutes, { prefix: '/api/tickets' })
  app.register(paymentRoutes, { prefix: '/api/payment' })
  app.register(cartRoutes, { prefix: '/api/cart' })
  app.register(orderRoutes, { prefix: '/api/orders' })
  app.register(paymentRoutes2, { prefix: '/api/payments' })

  // CMS
  app.register(cmsAuthRoutes, { prefix: '/api/cms/auth' })
  app.register(cmsDashboardRoutes, { prefix: '/api/cms/dashboard' })
  app.register(cmsInquiryRoutes, { prefix: '/api/cms/inquiries' })
  app.register(cmsProductRoutes, { prefix: '/api/cms/products' })
  app.register(cmsPipelineRoutes, { prefix: '/api/cms/pipeline' })
  app.register(cmsCaseStudyRoutes, { prefix: '/api/cms/case-studies' })
  app.register(cmsApplicationAreaRoutes, { prefix: '/api/cms/application-areas' })
  app.register(cmsDocumentRoutes, { prefix: '/api/cms/documents' })
  app.register(cmsBlogArticleRoutes, { prefix: '/api/cms/articles' })
  app.register(cmsAdminUserRoutes, { prefix: '/api/cms/admin-users' })
  app.register(cmsOrderRoutes, { prefix: '/api/cms/orders' })
  app.register(cmsPageSettingsRoutes, { prefix: '/api/cms/page-settings' })
  app.register(cmsGeneralSettingsRoutes, { prefix: '/api/cms/general-settings' })
  app.register(cmsMediaRoutes, { prefix: '/api/cms/media' })

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
