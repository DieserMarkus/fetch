import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { deleteItem } from '../../businessLogic/items'

const logger = createLogger('DeleteItem')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const eventId = event.pathParameters.eventId
    const itemId = event.pathParameters.itemId

    logger.info('Deleting item', {eventId, itemId})

    await deleteItem(eventId, itemId)

    return {
      statusCode: 202,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({})
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )