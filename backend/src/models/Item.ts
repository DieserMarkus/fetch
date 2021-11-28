export interface Item {
  userId: string
  itemId: string
  name: string
  createdBy: string
  creationDate: string
  modifiedDate?: string
  done: boolean
  attachmentUrl?: string
}