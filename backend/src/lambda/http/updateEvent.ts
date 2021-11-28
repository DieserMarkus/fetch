import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import { EventUtils } from '../../helpers/eventUtils'
import { UpdateEventRequest } from '../../requests/UpdateEventRequest'

const logger = createLogger('UpdateEvent')
const eventUtils = new EventUtils();

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const modifiedDate = new Date()
    modifiedDate.setDate(modifiedDate.getUTCDate())

    const userId = getUserId(event)
    const eventId = event.pathParameters.eventId
    const updatedEvent: UpdateEventRequest = JSON.parse(event.body)

    const owner = await eventUtils.checkOwnership(userId, eventId)
    logger.info('checkOwnership', {owner})

    if (owner) {

      logger.info('Updating event', {userId, eventId, modifiedDate})
      await eventUtils.updateEvent(userId, eventId, modifiedDate.toString(), updatedEvent)

      return {
        statusCode: 202,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({})
      }
      
    } else {

      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({})
      }

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
