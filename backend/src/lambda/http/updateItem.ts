import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { ItemUtils } from '../../helpers/itemUtils'
import { UpdateItemRequest } from '../../requests/UpdateItemRequest'

const logger = createLogger('UpdateItem')
const itemUtils = new ItemUtils();

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const modifiedDate = new Date()
    modifiedDate.setDate(modifiedDate.getUTCDate())

    const eventId = event.pathParameters.eventId
    const itemId = event.pathParameters.itemId
    const updatedItem: UpdateItemRequest = JSON.parse(event.body)

    logger.info('Updating item', {eventId, itemId, modifiedDate})

    await itemUtils.updateItem(eventId, itemId, modifiedDate.toString(), updatedItem)

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
