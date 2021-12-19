import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { getUserId, getUserName } from '../utils'
import { CreateItemRequest } from '../../requests/CreateItemRequest'
import { createItem } from '../../businessLogic/items'

const logger = createLogger('CreateItem')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const createdDate = new Date()
    createdDate.setDate(createdDate.getUTCDate())
    
    const userId = getUserId(event)
    const createdBy = getUserName(event)
    const eventId = event.pathParameters.eventId
    const newItem: CreateItemRequest = JSON.parse(event.body)
    const itemId = await createItem(userId, eventId, createdBy, createdDate.toString(), newItem)

    logger.info('Creating item', {userId, createdBy, createdDate, itemId})

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        item:
            {
              itemId: itemId,
              userId: userId,
              eventId: eventId,
              createdBy: createdBy,
              createdDate: createdDate,
              ...newItem
            }
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