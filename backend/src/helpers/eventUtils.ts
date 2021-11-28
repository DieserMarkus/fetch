import * as AWS from 'aws-sdk'
// import { stringify } from 'querystring';
// import * as AWSXRay from 'aws-xray-sdk'
import { Event } from "../models/Event";
import { createLogger } from '../utils/logger'
import { CreateEventRequest } from '../requests/CreateEventRequest'
import { UpdateEventRequest } from '../requests/UpdateEventRequest'

// const XAWS = AWSXRay.captureAWS(AWS)
const uuid = require('uuid/v4')
const logger = createLogger('eventUtils')

export class EventUtils{

    constructor(
        // Unsure why but I can't use XAWS here
        // private readonly dynamoDBClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly dynamoDBClient = new AWS.DynamoDB.DocumentClient(),
        private readonly eventsTable = process.env.EVENTS_TABLE,
        private readonly userEventsTable = process.env.USER_EVENTS_TABLE,
        private readonly userEventsIndex = process.env.USER_EVENTS_INDEX
    ) { }

    async createEvent(userId: string, userName: string, createdDate: string, newEvent: CreateEventRequest): Promise<string> {

        logger.info('createEvent', {userId, userName, createdDate, newEvent})

        const eventId = uuid()
        const event = {
            userId: userId,
            createdBy: userName,
            createdDate: createdDate,
            eventId: eventId,
            ...newEvent
        }
  
        await this.dynamoDBClient.put({
            TableName: this.eventsTable,
            Item: event
        }).promise()

        return eventId
    }

    async addExistingEvent(userId: string, eventId: string, addedDate: string, owner: Boolean) {

        logger.info('addExistingEvent', {userId, eventId, addedDate, owner})

        const event = {
            userId: userId,
            eventId: eventId,
            addedDate: addedDate.toString(),
            owner: owner
        }
  
        await this.dynamoDBClient.put({
            TableName: this.userEventsTable,
            Item: event
        }).promise()
    }

    // 1 - Get all events connected to the user via UserEventsTable (userId, eventId, ownership)
    // 2 - Get the data for each relevant event
    // 2 - Merge the data from the two queries
    async getEventsByUser(userId: string): Promise<Event[]> {

        logger.info('getEventsByUser', {userId})

        // 1 - Get all events connected to the user via UserEventsTable (userId, eventId, ownership)
        var param1 = {
            TableName: this.userEventsTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId' : userId
            }
        }

        const awsRequest = await this.dynamoDBClient.query(param1)
        const result1 = await awsRequest.promise()
        const events1 = result1.Items as Event[]
        
        if (result1.Count == 0) return <Event[]>[] 
        logger.info('First query result', {events1})

        // 2 - Add the metadata for each event from the events table

        var eventObject = {};
        var index = 0;

        events1.forEach(function (event) {
            index++;
            var eventKey = ":event" + index;
            var eventId = event.eventId
            eventObject[eventKey.toString()] = eventId;
        })
        
        var param2 = {
            TableName : this.eventsTable,
            FilterExpression : "eventId IN (" + Object.keys(eventObject).toString() + ")",
            ExpressionAttributeValues : eventObject
        };

        const result2 = await this.dynamoDBClient.scan(param2).promise()
        const events2 = result2.Items as Event[]

        logger.info('Second query result', {events2})

        const mergeById = (array1, array2) =>
            array1.map(itm => ({
            ...array2.find((item) => (item.eventId === itm.eventId) && item),
            ...itm
        }));

        var finalResult = mergeById(events1, events2)

        logger.info('Merged result', {finalResult})
        
        return finalResult as Event[]
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

    async updateEvent(userId: string, eventId: string, modifiedDate: string, updatedEvent:UpdateEventRequest) {

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

    async deleteAllEventsFromUserList(eventId: string) {

        logger.info('deleteAllEventsFromUserList', {eventId})

        // Get all userIds that have a connection to this event
        const param1 = {
            TableName: this.userEventsTable,
            IndexName: this.userEventsIndex,
            KeyConditionExpression: 'eventId = :eventId',
            ExpressionAttributeValues: {
                ':eventId' : eventId
            },
            ProjectionExpression : 'userId'
        }

        const awsRequest = await this.dynamoDBClient.query(param1)
        const result = await awsRequest.promise()

        logger.info('First query result', {result})

        // Now delete each event entry
        var userIdArray = [];
        result.Items.forEach(function (item) {
            
            logger.info('In loop', {item})
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

        var param2 = {
            RequestItems : {
                [this.userEventsTable] : userIdArray
            }
        };

        logger.info('param2', {param2})
        this.dynamoDBClient.batchWrite(param2, function(err, data) {
            if (err) {
                logger.info('Batch delete failed', {err})
            } else {
                logger.info('Batch delete successful', {data})
            }
        
        })
    }

    async deleteEventFromUserList(userId: string, eventId: string) {

        logger.info('deleteEventFromUserList', {userId, eventId})

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