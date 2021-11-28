import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { getUserId, getUserName } from '../utils';
import { EventUtils } from '../../helpers/eventUtils'
import { CreateEventRequest } from '../../requests/CreateEventRequest'

const logger = createLogger('CreateEvent')
const eventUtils = new EventUtils();

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const createdDate = new Date()
    createdDate.setDate(createdDate.getUTCDate())

    const userId = getUserId(event)
    const createdBy = getUserName(event)
    const newEvent: CreateEventRequest = JSON.parse(event.body)
    
    const eventId = await eventUtils.createEvent(userId, createdBy, createdDate.toString(), newEvent)
    await eventUtils.addExistingEvent(userId, eventId, createdDate.toString(), true)

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