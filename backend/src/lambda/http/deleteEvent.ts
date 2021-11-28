import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import { EventUtils } from '../../helpers/eventUtils'

const logger = createLogger('DeleteEvent')
const eventUtils = new EventUtils()

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const userId = getUserId(event)
    const eventId = event.pathParameters.eventId
    const owner = await eventUtils.checkOwnership(userId, eventId)
    logger.info('checkOwnership', {owner})

    // If it is the users own event, then delete it completely
    // Else just delete this users entry in the user-event-table
    if (owner) {
      logger.info('Deleting event', {userId, eventId})
      // Delete all itemAttachments and eventAttachments of this event
      // TODO

      // Delete all items of this event
      // TODO

      // Delete all user-event-references of this event for all users
      await eventUtils.deleteAllEventsFromUserList(eventId)

      // Delete the event itself
      await eventUtils.deleteEvent(userId, eventId)

    } else {
      // Delete the user-event-reference for this user
      logger.info('Deleting event from user list', {userId, eventId})
      await eventUtils.deleteEventFromUserList(userId, eventId)
    }

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