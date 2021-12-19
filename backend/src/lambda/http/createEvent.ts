import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { getUserId, getUserName } from '../utils';
import { CreateEventRequest } from '../../requests/CreateEventRequest'
import { addExistingEvent, createEvent } from '../../businessLogic/events'

const logger = createLogger('CreateEvent')

export const handler = middy(
  async (gatewayEvent: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const createdDate = new Date()
    createdDate.setDate(createdDate.getUTCDate())

    const userId = getUserId(gatewayEvent)
    const createdBy = getUserName(gatewayEvent)
    const newEvent: CreateEventRequest = JSON.parse(gatewayEvent.body)
    
    const eventId = await createEvent(userId, createdBy, createdDate.toString(), newEvent)
    await addExistingEvent(userId, eventId, createdDate.toString(), true)

    logger.info('Creating event', {userId, createdBy, createdDate, eventId})

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        event:
            {
              eventId: eventId,
              userId: userId,
              createdBy: createdBy,
              createdDate: createdDate,
              ...newEvent
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