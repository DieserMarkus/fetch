import * as AWS from 'aws-sdk'

export class AttachmentUtils {
    constructor(
        private readonly dynamoDBClient: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient(),
        private readonly itemsTable = process.env.ITEMS_TABLE,
        private readonly eventsTable = process.env.EVENTS_TABLE,
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET
    ){}

    async updateItemAttachmentUrl(eventId: string, itemId: string, modifiedDate:Date, attachmentUrl: string){

        await this.dynamoDBClient.update({
            TableName: this.itemsTable,
            Key: {
                'itemId' : itemId,
                'eventId' : eventId
            },
            UpdateExpression: "set attachmentUrl = :attachmentUrl, modifiedDate = :d",
            ExpressionAttributeValues: {
                ":attachmentUrl": `https://${this.bucketName}.s3.amazonaws.com/${attachmentUrl}`,
                ':d' : modifiedDate.toString()
            }
        }).promise();
    }

    async updateEventAttachmentUrl(userId: string, eventId: string, modifiedDate:Date, attachmentUrl: string){

        await this.dynamoDBClient.update({
            TableName: this.eventsTable,
            Key: {
                'eventId' : eventId,
                'userId' : userId
            },
            UpdateExpression: "set attachmentUrl = :attachmentUrl, modifiedDate = :d",
            ExpressionAttributeValues: {
                ":attachmentUrl": `https://${this.bucketName}.s3.amazonaws.com/${attachmentUrl}`,
                ':d' : modifiedDate.toString()
            }
        }).promise();
    }
}