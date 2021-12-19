import * as AWS from 'aws-sdk'
import { Item } from "../models/Item";
import { UpdateItemRequest } from '../requests/UpdateItemRequest'
import { createLogger } from '../utils/logger'
// import * as AWSXRay from 'aws-xray-sdk'

// const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('eventAccess')

export class ItemAccess {

    constructor(
        // Unsure why but I can't use XAWS here
        // private readonly dynamoDBClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly dynamoDBClient = new AWS.DynamoDB.DocumentClient(),
        private readonly itemsTable = process.env.ITEMS_TABLE,
        private readonly index = process.env.ITEMS_INDEX,
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET
    ) { }

    async updateItemAttachmentUrl(eventId: string, itemId: string, modifiedDate: Date, attachmentUrl: string) {

        logger.info('updateItemAttachmentUrl', {eventId, itemId, modifiedDate, attachmentUrl})

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

    async createItem(item: Item) {

        logger.info('createItem', item)

        await this.dynamoDBClient.put({
            TableName: this.itemsTable,
            Item: item
        }).promise()

    }

    async getItemsForEvent(eventId: string): Promise<Item[]> {

        logger.info('getItemsForEvent', eventId)

        const result = await this.dynamoDBClient.query({
            TableName: this.itemsTable,
            IndexName: this.index,
            KeyConditionExpression: 'eventId = :eventId',
            ExpressionAttributeValues: {
                ':eventId' : eventId
            }
        }).promise()
        return result.Items as Item[]

    }

    async updateItem(eventId: string, itemId: string, modifiedDate: string, modifiedBy: string, updatedItem: UpdateItemRequest) {

        logger.info('updateItem', {eventId, itemId, modifiedDate, modifiedBy, updatedItem})

        await this.dynamoDBClient.update({
            TableName: this.itemsTable,
            Key: {
                'itemId' : itemId,
                'eventId' : eventId
            },
            UpdateExpression: 'set #namefield = :name, modifiedDate = :date, modifiedBy = :by, done = :done',
            ExpressionAttributeValues: {
                ':name' : updatedItem.name,
                ':date' : modifiedDate,
                ':by' : modifiedBy,
                ':done' : updatedItem.done
            },
            ExpressionAttributeNames:{
                '#namefield' : 'name'
              }
          }).promise()

    }

    async deleteItem(eventId: string, itemId: string) {

        logger.info('deleteItem', {eventId, itemId})

        const param = {
            TableName: this.itemsTable,
            Key: {
                'itemId' : itemId,
                'eventId' : eventId
            }
        }
        await this.dynamoDBClient.delete(param).promise()
    }

}