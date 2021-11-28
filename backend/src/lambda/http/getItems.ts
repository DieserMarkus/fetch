import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { ItemUtils } from '../../helpers/itemUtils'

const logger = createLogger('GetItems')
const itemUtils = new ItemUtils();

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const eventId = event.pathParameters.eventId
    const items = await itemUtils.getItemsForEvent(eventId)

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