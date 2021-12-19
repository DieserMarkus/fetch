import { ItemAccess } from '../dataLayer/itemAccess'
import { Item } from '../models/Item'
import { CreateItemRequest } from '../requests/CreateItemRequest'
import { UpdateItemRequest } from '../requests/UpdateItemRequest'
import { createLogger } from '../utils/logger'

const uuid = require('uuid/v4')
const logger = createLogger('itemLogic')
const itemAccess = new ItemAccess()

export async function updateItemAttachmentUrl(eventId: string, itemId: string, modifiedDate: Date, attachmentUrl: string) {

    logger.info('createItem', {eventId, itemId, modifiedDate, attachmentUrl})
    itemAccess.updateItemAttachmentUrl(eventId, itemId, modifiedDate, attachmentUrl)

}

export async function createItem(userId: string, eventId: string, userName: string, createdDate: string, newItem: CreateItemRequest): Promise<string> {

    logger.info('createItem', {userId, eventId, userName, createdDate, newItem})
    const itemId = uuid()
    const item = {
        userId: userId,
        eventId: eventId,
        createdBy: userName,
        createdDate: createdDate,
        itemId: itemId,
        ...newItem
    }
    itemAccess.createItem(item)
    return itemId

}

export async function getItemsForEvent(eventId: string): Promise<Item[]> {

    logger.info('getItemsForEvent', {eventId})
    return itemAccess.getItemsForEvent(eventId)

}

export async function updateItem(eventId: string, itemId: string, modifiedDate: string, modifiedBy: string, updatedItem: UpdateItemRequest) {

    logger.info('updateItem', {eventId, itemId, modifiedDate, modifiedBy, updatedItem})
    return itemAccess.updateItem(eventId, itemId, modifiedDate, modifiedBy, updatedItem)

}

export async function deleteItem(eventId: string, itemId: string) {

    logger.info('deleteItem', {eventId, itemId})
    return itemAccess.deleteItem(eventId, itemId)

}