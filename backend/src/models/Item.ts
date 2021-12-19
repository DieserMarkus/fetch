export interface Item {
  userId: string
  itemId: string
  name: string
  createdBy: string
  createdDate: string
  modifiedDate?: string
  done?: boolean
  attachmentUrl?: string
}