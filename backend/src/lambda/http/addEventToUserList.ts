import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import { addExistingEvent } from '../../businessLogic/events'

const logger = createLogger('CreateEvent')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const addedDate = new Date()
    addedDate.setDate(addedDate.getUTCDate())

    const userId = getUserId(event)
    const eventId = event.pathParameters.eventId

    logger.info('Adding existing event', {userId, eventId, addedDate})
    await addExistingEvent(userId, eventId, addedDate.toString(), false)

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        event:
            {
              userId: userId,
              eventId: eventId,
              addedDate: addedDate,
              owner: false
            }
      })
    };
  })

  handler
  .use(httpErrorHandler())
  .use(
      cors({
        credentials: true
  })
 )