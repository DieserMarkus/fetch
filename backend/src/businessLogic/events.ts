import { EventAccess } from '../dataLayer/eventAccess'
import { Event } from '../models/Event'
import { CreateEventRequest } from '../requests/CreateEventRequest'
import { UpdateEventRequest } from '../requests/UpdateEventRequest'
import { createLogger } from '../utils/logger'

const uuid = require('uuid/v4')
const logger = createLogger('eventLogic')
const eventAccess = new EventAccess()

export async function updateEventAttachmentUrl(userId: string, eventId: string, modifiedDate: Date, attachmentUrl: string) {

    logger.info('createEvent', {userId, eventId, modifiedDate, attachmentUrl})
    eventAccess.updateEventAttachmentUrl(userId, eventId, modifiedDate, attachmentUrl)

}

export async function createEvent(userId: string, userName: string, createdDate: string, newEvent: CreateEventRequest): Promise<string> {

    logger.info('createEvent', {userId, userName, createdDate, newEvent})
    const eventId = uuid()
    const event = {
        userId: userId,
        createdBy: userName,
        createdDate: createdDate,
        eventId: eventId,
        ...newEvent
    }
    eventAccess.createEvent(event)
    return eventId

}

export async function addExistingEvent(userId: string, eventId: string, addedDate: string, owner: boolean) {

    logger.info('addExistingEvent', {userId, eventId, addedDate, owner})

    const event = {
        userId: userId,
        eventId: eventId,
        addedDate: addedDate.toString(),
        owner: owner
    }
    eventAccess.addExistingEvent(event)

}

export async function checkOwnership(userId: string, eventId: string): Promise<Boolean> {

    logger.info('checkOwnership', {userId, eventId})
    return eventAccess.checkOwnership(userId, eventId)

}

// 1 - Get all events connected to the user via UserEventsTable (userId, eventId, ownership)
// 2 - Get the data for each relevant event
// 3 - Merge the data from the two queries
export async function getEventsByUser(userId: string): Promise<Event[]> {

    logger.info('getEventsByUser', {userId})

    // 1 - Get all events connected to the user via UserEventsTable (userId, eventId, ownership)
    const events = await eventAccess.getEventsForUser(userId)
    logger.info('First query result', {events})
    if (events.length == 0) return <Event[]>[] 

    // 2 - Add the metadata for each event from the events table
    var eventObject = {};
    var index = 0;
    events.forEach(function (event) {
        index++;
        var eventKey = ":event" + index;
        var eventId = event.eventId
        eventObject[eventKey.toString()] = eventId;
    })

    const eventsWithMetadata = await eventAccess.getEventMetadata(eventObject)
    logger.info('Second query result', {eventsWithMetadata})

    // 3 - Merge
    const mergeById = (array1, array2) =>
        array1.map(itm => ({
        ...array2.find((item) => (item.eventId === itm.eventId) && item),
        ...itm
    }))

    var finalResult = mergeById(events, eventsWithMetadata)
    logger.info('Merged result', {finalResult})
    return finalResult as Event[]

}

export async function updateEvent(userId: string, eventId: string, modifiedDate: string, updatedEvent: UpdateEventRequest) {

    logger.info('updateEvent', {userId, eventId, modifiedDate, updatedEvent})
    eventAccess.updateEvent(userId, eventId, modifiedDate, updatedEvent)

}

export async function deleteEvent(userId: string, eventId: string) {

    logger.info('deleteEvent', {userId, eventId})
    eventAccess.deleteEvent(userId, eventId)

}

// An event is deleted by the owner, so we need to delete it for every user as well
// I'm sure there is a more elegant way, but I am bound to know the userId due to the way I set up the DynamoDB tables
// 1 - Get all userIds that have a connection to this event
// 2 - Delete each matching event entry
export async function deleteAllEventsFromUserList(eventId: string) {

    logger.info('deleteAllEventsFromUserList', {eventId})

    // 1 - Get all userIds that have a connection to this event
    const usersWithTheEvent = await eventAccess.getUserIdsWithEventRelation(eventId)
    logger.info('UserIds with event relation', {usersWithTheEvent})

    // 2 - Delete each matching event entry
    await eventAccess.deleteEventForEachUser(eventId, usersWithTheEvent)

}

export async function deleteEventForUser(userId: string, eventId: string) {

    logger.info('deleteEventFromUserList', {userId, eventId})
    eventAccess.deleteEventForUser(userId, eventId)

}