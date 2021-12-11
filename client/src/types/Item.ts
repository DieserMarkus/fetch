export interface Item {
  itemId: string
  eventId: string
  userId: string
  createdBy: string
  createdDate: Date
  name: string
  done?: boolean
  attachmentUrl?: string
  modifiedDate: Date
  modifiedBy?: string
}