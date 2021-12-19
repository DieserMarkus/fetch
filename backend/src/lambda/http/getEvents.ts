import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import { getEventsByUser } from '../../businessLogic/events'

const logger = createLogger('GetEvents')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const userId = getUserId(event)
    const events = await getEventsByUser(userId)

    logger.info('Getting events', {userId})

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        events
      })
  }
})

handler
 .use(httpErrorHandler())
 .use(
     cors({
       credentials: true
  })
)