import { Location, History } from 'history'
import update from 'immutability-helper'
import dummy from '../img/Dummy.png'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'
import ReactTimeAgo from 'react-time-ago'
import { createItem, deleteItem, getItems, patchItem } from '../api/items-api'
import Auth from '../auth/Auth'
import { Item } from '../types/Item'
import { Event } from '../types/Event'

interface ItemsProps {
  auth: Auth
  history: History
  location: Location
}

interface ItemsState {
  items: Item[]
  newItemName: string
  loadingItems: boolean
}

export class Items extends React.PureComponent<ItemsProps, ItemsState> {
  state: ItemsState = {
    items: [],
    newItemName: '',
    loadingItems: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newItemName: event.target.value })
  }

  onEditButtonClick = (item: Item, event: Event) => {
    this.props.history.push({ 
      pathname: `/events/${event.eventId}/items/${item.itemId}/edit`,
      state: { 
        item: item,
        event: event
      }
    });
  }

  onItemCreate = async () => {
    if (this.state.newItemName === '') {
      return
    }
    this.setState({
      loadingItems: true
    })
    try {
      const { event } = this.props.location.state as any || {event: { event: "" }}
      const newItem = await createItem(this.props.auth.getIdToken(), event.eventId, {
        name: this.state.newItemName
      })
      this.setState({
        items: [...this.state.items, newItem],
        newItemName: ''
      })
    } catch {
      alert('Could not create the item.')
    }
    this.setState({
      loadingItems: false,
      newItemName: ''
    })
  }

  onItemDelete = async (itemId: string, eventId: string) => {
    try {
      await deleteItem(this.props.auth.getIdToken(), itemId, eventId)
      this.setState({
        items: this.state.items.filter(item => item.itemId !== itemId)
      })
    } catch {
      alert('Could not delete the item.')
    }
  }

  onItemCheck = async (pos: number, eventId: string) => {
    try {
      const item = this.state.items[pos]
      await patchItem(this.props.auth.getIdToken(), item.itemId, eventId, {
        name: item.name,
        done: !item.done
      })
      this.setState({
        items: update(this.state.items, {
          [pos]: { done: { $set: !item.done } }
        })
      })
    } catch {
      alert('Could not update the item.')
    }
  }

  async componentDidMount() {
    try {
      const { event } = this.props.location.state as any || {event: { event: "" }}
      const items = await getItems(this.props.auth.getIdToken(), event.eventId)

      this.setState({
        items,
        loadingItems: false
      })
    } catch(e: unknown) {
      if (e instanceof Error) {
        alert('Could not fetch items:' + e.message)
      } else {
        alert('Could not fetch items.')
      }
    }
  }

  render() {
    const { event } = this.props.location.state as any || {event: { event: "" }}
    return (
      <div>
        <Header as="h1">{event.name} (<ReactTimeAgo date={event.eventDate} />)</Header>
        Created <ReactTimeAgo date={event.createdDate} /> by {event.createdBy}
        <h4>{event.description}</h4>
        
        {this.renderCreateItemInput()}

        {this.renderItems()}
      </div>
    )
  }

  renderCreateItemInput() {
    const handleKeyDown = (event: { key: string }) => {
      if (event.key === 'Enter') {
        this.onItemCreate()
      }
    }

    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'Add this',
              onClick: this.onItemCreate
            }}
            fluid
            actionPosition="left"
            placeholder="Someone should bring this item..."
            onChange={this.handleNameChange}
            onKeyDown={handleKeyDown}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderItems() {
    if (this.state.loadingItems) {
      return this.renderLoading()
    }

    return this.renderItemsList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
        <h4>FETCHing items</h4>
        </Loader>
      </Grid.Row>
    )
  }

  renderModified(item: Item) {
    if (item.modifiedDate) {
      return (
        <div>Modified <ReactTimeAgo date={item.modifiedDate} /></div>
      )}
  }

  renderItemsList() {
    var buttonUrl
    const { event } = this.props.location.state as any || {event: { event: "" }}
    return (
      <Grid padded>
        {this.state.items.map((item, pos) => {

          if (item.attachmentUrl) { buttonUrl = item.attachmentUrl } 
          else { buttonUrl = dummy }

          return (
            <Grid.Row key={item.itemId}>
              <Grid.Column width={3} verticalAlign="middle">
                <Image src={buttonUrl} size="tiny" wrapped />
              </Grid.Column>
              <Grid.Column width={4} verticalAlign="middle">
                <h3>{item.name}</h3>
              </Grid.Column>
              <Grid.Column width={3} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onItemCheck(pos, event.eventId)}
                  checked={item.done}
                />
              </Grid.Column>
              <Grid.Column width={3} floated="right" verticalAlign="middle">
                {item.createdBy} <br />
                Added <ReactTimeAgo date={item.createdDate} /><br />
                {this.renderModified(item)}
              </Grid.Column>
              <Grid.Column width={1} floated="right" verticalAlign="middle">
              <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(item, event)}
                >
                  <Icon name="pencil" />
                </Button>
                <Button
                  icon
                  color="red"
                  onClick={() => this.onItemDelete(item.itemId, event.eventId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }
}
