declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: JWTPayload
  }
}

export interface JWTPayload {
  sub: string
  email: string
  role: string
  type: 'user' | 'cms_admin'
}
