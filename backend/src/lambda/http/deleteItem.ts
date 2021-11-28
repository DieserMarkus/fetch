import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { ItemUtils } from '../../helpers/itemUtils'

const logger = createLogger('DeleteItem')
const itemUtils = new ItemUtils()

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const eventId = event.pathParameters.eventId
    const itemId = event.pathParameters.itemId

    logger.info('Deleting item', {eventId, itemId})

    await itemUtils.deleteItem(eventId, itemId)

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