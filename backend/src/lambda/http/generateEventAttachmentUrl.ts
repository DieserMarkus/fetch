import 'source-map-support/register'
import * as uuid from 'uuid'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import { updateEventAttachmentUrl } from '../../businessLogic/events'

const logger = createLogger('GenerateEventUploadURL')
const bucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION
const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({signatureVersion: 'v4'})

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const modifiedDate = new Date()
    modifiedDate.setDate(modifiedDate.getUTCDate())

    const attachmentId = uuid()
    const userId = getUserId(event)
    const eventId = event.pathParameters.eventId

    logger.info('Generating attachment URL', {userId, eventId})

    const url = s3.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: attachmentId,
      Expires: parseInt(urlExpiration)
    });

    await updateEventAttachmentUrl(userId, eventId, modifiedDate, attachmentId)
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        uploadUrl: url
      })
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
