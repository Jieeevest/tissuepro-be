import { buildApp } from './app'
import { initMinioBucket } from './lib/minio'

const PORT = parseInt(process.env.PORT ?? '5176')
const HOST = process.env.HOST ?? '0.0.0.0'

const app = buildApp()

app.listen({ port: PORT, host: HOST }, async (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  await initMinioBucket()
})
