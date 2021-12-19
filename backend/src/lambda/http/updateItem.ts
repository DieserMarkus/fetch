import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { getUserName } from '../utils'
import { UpdateItemRequest } from '../../requests/UpdateItemRequest'
import { updateItem } from '../../businessLogic/items'

const logger = createLogger('UpdateItem')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const modifiedDate = new Date()
    modifiedDate.setDate(modifiedDate.getUTCDate())

    const eventId = event.pathParameters.eventId
    const itemId = event.pathParameters.itemId
    const createdBy = getUserName(event)
    const updatedItem: UpdateItemRequest = JSON.parse(event.body)

    logger.info('Updating item', {eventId, itemId, modifiedDate})

    await updateItem(eventId, itemId, modifiedDate.toString(), createdBy, updatedItem)

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
