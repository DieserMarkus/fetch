import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { getItemsForEvent } from '../../businessLogic/items'

const logger = createLogger('GetItems')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const eventId = event.pathParameters.eventId
    const items = await getItemsForEvent(eventId)

    logger.info('Getting items', {eventId})

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        items
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