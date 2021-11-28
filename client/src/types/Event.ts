export interface Event {
  eventId: string
  userId: string
  eventDate: Date
  createdBy: string
  createdDate: Date
  name: string
  owner: boolean
  description?: string
  attachmentUrl?: string
  modifiedDate?: Date
  addedDate?: Date
}