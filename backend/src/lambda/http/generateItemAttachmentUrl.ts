import 'source-map-support/register'
import * as uuid from 'uuid'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { updateItemAttachmentUrl } from '../../businessLogic/items'

const logger = createLogger('GenerateItemUploadURL')
const bucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION
const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({signatureVersion: 'v4'})

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const modifiedDate = new Date()
    modifiedDate.setDate(modifiedDate.getUTCDate())

    const attachmentId = uuid()
    const eventId = event.pathParameters.eventId
    const itemId = event.pathParameters.itemId

    logger.info('Generating attachment URL', {eventId, itemId})

    const url = s3.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: attachmentId,
      Expires: parseInt(urlExpiration)
    });

    await updateItemAttachmentUrl(eventId, itemId, modifiedDate, attachmentId)
    
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
