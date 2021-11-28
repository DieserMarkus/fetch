import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils';
import { EventUtils } from '../../helpers/eventUtils'

const logger = createLogger('CreateEvent')
const eventUtils = new EventUtils();

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const addedDate = new Date()
    addedDate.setDate(addedDate.getUTCDate())

    const userId = getUserId(event)
    const eventId = event.pathParameters.eventId
    await eventUtils.addExistingEvent(userId, eventId, addedDate.toString(), false)

    logger.info('Adding existing event', {userId, eventId, addedDate})

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