import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { Item } from "../models/Item";
import { CreateItemRequest } from '../requests/CreateItemRequest'
import { UpdateItemRequest } from '../requests/UpdateItemRequest'

// const XAWS = AWSXRay.captureAWS(AWS)
const uuid = require('uuid/v4')

export class ItemUtils{

    constructor(
        // Unsure why but I can't use XAWS here
        // private readonly dynamoDBClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly dynamoDBClient = new AWS.DynamoDB.DocumentClient(),
        private readonly itemsTable = process.env.ITEMS_TABLE,
        private readonly index = process.env.ITEMS_INDEX
    ) { }

    async createItem(userId: string, eventId: string, userName: string, createdDate: string, newItem: CreateItemRequest): Promise<string>{
        const itemId = uuid()
        const item = {
            userId: userId,
            eventId: eventId,
            createdBy: userName,
            createdDate: createdDate,
            itemId: itemId,
            ...newItem
        }

        await this.dynamoDBClient.put({
            TableName: this.itemsTable,
            Item: item
        }).promise()

        return itemId
    }

    async getItemsForEvent(eventId: string): Promise<Item[]>{
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

    async updateItem(eventId: string, itemId: string, modifiedDate: string, updatedItem:UpdateItemRequest) {
        await this.dynamoDBClient.update({
            TableName: this.itemsTable,
            Key: {
                'itemId' : itemId,
                'eventId' : eventId
            },
            UpdateExpression: 'set #namefield = :n, modifiedDate = :d, done = :done',
            ExpressionAttributeValues: {
                ':n' : updatedItem.name,
                ':d' : modifiedDate,
                ':done' : updatedItem.done
            },
            ExpressionAttributeNames:{
                '#namefield' : 'name'
              }
          }).promise()
    }

    async deleteItem(eventId: string, itemId: string) {
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