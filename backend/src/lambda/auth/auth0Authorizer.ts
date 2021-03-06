import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import request from 'request-promise';
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('Auth0Authorizer')
const jwksUrl = 'https://stuff.eu.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  const jwksRequest = await request({ uri: jwksUrl, strictSsl: true, json: true }).promise();
  const jwks = jwksRequest.keys;

  logger.info('JWT verification', jwt)

  const signingKeys = jwks.map(key => {
    return { kid: key.kid, nbf: key.nbf, publicKey: convertToPEM(key.x5c[0]) };
  });
  const signingKey = signingKeys[0].publicKey;

  return verify(token, signingKey, {algorithms: ['RS256']}) as JwtPayload;
}

function convertToPEM(c) {
  c = c.match(/.{1,64}/g).join('\n');
  return `-----BEGIN CERTIFICATE-----\n${c}\n-----END CERTIFICATE-----\n`;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}