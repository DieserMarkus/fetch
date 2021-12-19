import * as AWS from 'aws-sdk'
import { Event } from '../models/Event'
import { UpdateEventRequest } from '../requests/UpdateEventRequest'
import { createLogger } from '../utils/logger'
// import { stringify } from 'querystring'
// import * as AWSXRay from 'aws-xray-sdk'

// const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('eventAccess')

export class EventAccess {

    constructor(
        // Unsure why but I can't use XAWS here
        // private readonly dynamoDBClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly dynamoDBClient = new AWS.DynamoDB.DocumentClient(),
        private readonly eventsTable = process.env.EVENTS_TABLE,
        private readonly userEventsTable = process.env.USER_EVENTS_TABLE,
        private readonly userEventsIndex = process.env.USER_EVENTS_INDEX,
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET
    ) { }

    async updateEventAttachmentUrl(userId: string, eventId: string, modifiedDate: Date, attachmentUrl: string) {

        logger.info('updateEventAttachmentUrl', {userId, eventId, modifiedDate, attachmentUrl})

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

    async createEvent(event: Event) {

        logger.info('createEvent', event)

        await this.dynamoDBClient.put({
            TableName: this.eventsTable,
            Item: event
        }).promise()

    }

    async addExistingEvent(event: Event) {

        logger.info('addExistingEvent', event)
  
        await this.dynamoDBClient.put({
            TableName: this.userEventsTable,
            Item: event
        }).promise()

    }

    async checkOwnership(userId: string, eventId: string): Promise<Boolean> {

        logger.info('checkOwnership', {userId, eventId})

        var param = {
            TableName: this.userEventsTable,
            KeyConditionExpression: 'userId = :userId AND eventId = :eventId',
            ExpressionAttributeValues: {
                ':userId' : userId,
                ':eventId' : eventId
            },
            ExpressionAttributeNames: {
                '#o': 'owner'
            },
            ProjectionExpression : '#o'
        }

        const awsRequest = await this.dynamoDBClient.query(param)
        const result = await awsRequest.promise()
        return result.Items[0] as Boolean
    }

    async getEventsForUser(userId: string): Promise<Event[]> {

        logger.info('getEventsForUser', userId)

        var param = {
            TableName: this.userEventsTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId' : userId
            }
        }
    
        const awsRequest = await this.dynamoDBClient.query(param)
        const result = await awsRequest.promise()
        return result.Items as Event[]

    }

    async getEventMetadata(eventObject: {}): Promise<Event[]> {

        logger.info('getEventMetadata', eventObject)
    
        var param = {
            TableName : this.eventsTable,
            FilterExpression : "eventId IN (" + Object.keys(eventObject).toString() + ")",
            ExpressionAttributeValues : eventObject
        };
    
        const result = await this.dynamoDBClient.scan(param).promise()
        return result.Items as Event[]
    
    }

    async updateEvent(userId: string, eventId: string, modifiedDate: string, updatedEvent: UpdateEventRequest) {

        logger.info('updateEvent', {userId, eventId, modifiedDate, updatedEvent})

        var updateExpression = 'set'
        var ExpressionAttributeNames={}
        var ExpressionAttributeValues = {}

        for (const property in updatedEvent) {
            updateExpression += ` #${property} = :${property} ,`
            ExpressionAttributeNames['#' + property] = property
            ExpressionAttributeValues[':' + property] = updatedEvent[property]
        }

        updateExpression += ` #modifiedDate = :modifiedDate`
        ExpressionAttributeNames['#modifiedDate'] = 'modifiedDate'
        ExpressionAttributeValues[':modifiedDate'] = modifiedDate

        await this.dynamoDBClient.update({
            TableName: this.eventsTable,
            Key: {
                'eventId' : eventId,
                'userId' : userId
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: ExpressionAttributeNames,
            ExpressionAttributeValues: ExpressionAttributeValues
          }).promise()

    }

    async deleteEvent(userId: string, eventId: string) {

        logger.info('deleteEvent', {userId, eventId})

        const param = {
            TableName: this.eventsTable,
            Key: {
                'eventId' : eventId,
                'userId' : userId
            }
        }
        await this.dynamoDBClient.delete(param).promise()

    }

    async getUserIdsWithEventRelation(eventId: string) {

        logger.info('getUserIdsWithEventRelation', eventId)

        const param = {
            TableName: this.userEventsTable,
            IndexName: this.userEventsIndex,
            KeyConditionExpression: 'eventId = :eventId',
            ExpressionAttributeValues: {
                ':eventId' : eventId
            },
            ProjectionExpression : 'userId'
        }

        const awsRequest = await this.dynamoDBClient.query(param)
        return await awsRequest.promise()

    }

    async deleteEventForEachUser(eventId: string, usersWithTheEvent: any) {

        logger.info('deleteEventForEachUser', {eventId, usersWithTheEvent})

        var userIdArray = [];
        usersWithTheEvent.Items.forEach(function (item) {
            
            var user = {
                DeleteRequest : {
                    Key : {
                        'userId' : item.userId,
                        'eventId': eventId    
                    }
                }
            };
            userIdArray.push(user);
        })

        var param = {
            RequestItems : {
                [this.userEventsTable] : userIdArray
            }
        }

        this.dynamoDBClient.batchWrite(param).promise()

    }

    async deleteEventForUser(userId: string, eventId: string) {

        logger.info('deleteEventForUser', {userId, eventId})

        const param = {
            TableName: this.userEventsTable,
            Key: {
                'eventId' : eventId,
                'userId' : userId
            }
        }
        await this.dynamoDBClient.delete(param).promise()
    }

}