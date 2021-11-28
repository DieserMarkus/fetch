export interface JwtPayload {
  iss: string
  sub: string
  iat: number
  exp: number
  name?: string
  picture?: string
}