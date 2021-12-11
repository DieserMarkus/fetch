import { History } from 'history'
import React from 'react'
import { Button, Divider, Grid, Icon, Input, Image, Loader, Confirm, Segment, Popup, Header, Label }  from 'semantic-ui-react'
import ReactTimeAgo from 'react-time-ago'
import { createEvent, deleteEvent, getEvents, addEvent } from '../api/events-api'
import Auth from '../auth/Auth'
import dummy from '../img/Dummy.png'
import { Event } from '../types/Event'
import DatePicker from "react-datepicker"
import de from 'date-fns/locale/de'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
registerLocale('de', de)

interface EventsProps {
  auth: Auth
  history: History
}

interface EventsState {
  events: Event[]
  loadingEvents: boolean
  // Popup to create a new event
  popupCreateEventIsOpen: boolean
  popupCreateEventErrorLabelEventName: boolean
  popupCreateEventErrorLabelEventExists: boolean
  newEventName: string
  newEventDate: Date
  newEventDescription: string
  // Popup to add an existing event
  popupAddEventIsOpen: boolean
  popupAddEventErrorLabelEventIdInvalid: boolean
  popupAddEventErrorLabelEventExists: boolean
  eventCode: string
  // Delete confirmation
  confirmDeleteIsopen: boolean[]
}

export class Events extends React.PureComponent<EventsProps, EventsState> {
  state: EventsState = {
    events: [],
    loadingEvents: true,
    popupCreateEventIsOpen: false,
    popupCreateEventErrorLabelEventName: false,
    popupCreateEventErrorLabelEventExists: false,
    newEventName: '',
    newEventDate: new Date(),
    newEventDescription: '',
    popupAddEventIsOpen: false,
    popupAddEventErrorLabelEventIdInvalid: false,
    popupAddEventErrorLabelEventExists: false,
    eventCode: '',
    confirmDeleteIsopen: [false]
  }

  addExistingEvent = async () => {

    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(this.state.eventCode)) {
      this.setState({ popupAddEventErrorLabelEventIdInvalid: true }) 
      return
    }

    if (this.state.events.some(e => e.eventId === this.state.eventCode)) {
      this.setState({ popupAddEventErrorLabelEventExists: true }) 
      return
    }

    try {
      this.setState({
        loadingEvents: true,
        popupAddEventIsOpen: false
      })
      await addEvent(this.props.auth.getIdToken(), this.state.eventCode)

      this.setState({
        events: await getEvents(this.props.auth.getIdToken()),
        eventCode: ''
      }) 

    } catch(e: unknown) {
      if (e instanceof Error) {
        console.log('Could not add the event.' + e.message)
      } else {
        console.log('Could not add the event.')
      }
    }
    this.setState({
      loadingEvents: false,
      popupAddEventErrorLabelEventExists: false,
      popupAddEventErrorLabelEventIdInvalid: false
    })
  }

  handlePopupAddEventOpen = () => {
    this.setState({ popupAddEventIsOpen: true })
  }

  handlePopupAddEventClose = () => {
    this.setState({ 
      popupAddEventIsOpen: false,
      popupAddEventErrorLabelEventExists: false, 
      popupAddEventErrorLabelEventIdInvalid: false 
    })
  }

  handlePopupCreateEventOpen = () => {
    this.setState({ popupCreateEventIsOpen: true })
  }

  handlePopupCreateEventClose = () => {
    this.setState({ 
      popupCreateEventIsOpen: false,
      popupCreateEventErrorLabelEventExists: false, 
      popupCreateEventErrorLabelEventName: false 
    })
  }

  handleEventCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ eventCode: event.target.value })
  }

  renderAddEventWithPopUp() {
    const handleKeyDown = (event: { key: string }) => {
      if (event.key === 'Enter') {
        this.addExistingEvent()
      }
    }

    return (
      <Popup
      trigger={<Button color='red' content='Add an existing event' style={{width: '100%'}} />}
      on='click'
      open={this.state.popupAddEventIsOpen}
      onClose={this.handlePopupAddEventClose}
      onOpen={this.handlePopupAddEventOpen}
      onKeyDown={handleKeyDown}
      position='bottom center'
      size='large'
      style={{padding: '2em'}}
    >
      <Popup.Header>
        <span>You received an event code?</span>
      </Popup.Header>
      <Popup.Content>
        <p></p>
        <Input primary='true'
          action={{
            color: 'red',
            icon: 'share',
            onClick: this.addExistingEvent
          }}
          actionPosition='left'
          placeholder='Event Code'
          style={{width: '100%'}}
          onChange={this.handleEventCodeChange}
        />

        { this.state.popupAddEventErrorLabelEventExists 
          ? 
          <Label basic color='red' pointing>
            This event is already in your list.
          </Label>
          : null
        }

        { this.state.popupAddEventErrorLabelEventIdInvalid 
          ? 
          <Label basic color='red' pointing>
            Please enter a valid event ID.
          </Label>
          : null
        }

      </Popup.Content>
    </Popup>
    )
  }

  renderCreateEventWithPopUp() {
    const handleKeyDown = (event: { key: string }) => {
      if (event.key === 'Enter') {
        this.createEvent()
      }
    }

    return (
      <Popup
      trigger={<Button color='red' content='Create a new event' style={{width: '100%'}} />}
      on='click'
      open={this.state.popupCreateEventIsOpen}
      onClose={this.handlePopupCreateEventClose}
      onOpen={this.handlePopupCreateEventOpen}
      onKeyDown={handleKeyDown}
      position='bottom center'
      size='large'
      style={{padding: '2em'}}
    >
      <Popup.Header>
        <span>Add some information</span>
      </Popup.Header>
      <Popup.Content>
        <p></p>
        <Input primary='true'
          action={{
            color: 'red',
            icon: 'add',
            onClick: this.createEvent
          }}
          actionPosition='left'
          placeholder='Event name'
          style={{width: '100%'}}
          onChange={this.handleNameChange}
        />

        { this.state.popupCreateEventErrorLabelEventExists 
          ? 
          <Label basic color='red' pointing>
            This event is already in your list.
          </Label>
          : null
        }

        { this.state.popupCreateEventErrorLabelEventName 
          ? 
          <Label basic color='red' pointing>
            Please enter an event name.
          </Label>
          : null
        }

        <Divider clearing hidden />

        <DatePicker 
          minDate={new Date()}
          selected={this.state.newEventDate}
          onChange={this.handleDateChange}
          locale='de'
          showTimeSelect
          timeFormat='p'
          timeIntervals={15}
          dateFormat='Pp'
          placeholderText='Pick a Date'
        />

        <Divider clearing hidden />

        <Input
          placeholder='Optional description'
          onChange={this.handleDescriptionChange}
          style={{width: '100%'}}
        />

      </Popup.Content>
    </Popup>
    )
  }

  addEventButton() {
    if (this.props.auth.isAuthenticated()) {
      return (
        <div>
          {this.renderAddEventWithPopUp()}
        </div>
      )
    }
  }

  createEventButton() {
    if (this.props.auth.isAuthenticated()) {
      return (
        <div>
          {this.renderCreateEventWithPopUp()}
        </div>
      )
    }
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newEventName: event.target.value })
  }

  handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newEventDescription: event.target.value })
  }

  handleDateChange = (date: Date) => {
    this.setState({ newEventDate: date })
  }

  onEditButtonClick = (event: Event) => {
    this.props.history.push({ 
      pathname: `/events/${event.eventId}/edit`,
      state: { 
        event: event
      }
    })
  }

  onLabelClick = (event: Event) => {
    this.props.history.push({ 
      pathname: `/events/${event.eventId}/items`,
      state: { 
        event: event
      }
    })
  }

  createEvent = async () => {
    try {
      if (this.state.events.some(e => e.name === this.state.newEventName)) {
        this.setState({ popupCreateEventErrorLabelEventExists: true, popupCreateEventErrorLabelEventName: false })
        this.setState({  }) 
        return
      }

      if (this.state.newEventName === '') {
        this.setState({ popupCreateEventErrorLabelEventExists: false, popupCreateEventErrorLabelEventName: true }) 
        return
      }

      this.setState({
        loadingEvents: true,
        popupCreateEventIsOpen: false
      })
      await createEvent(this.props.auth.getIdToken(), {
        name: this.state.newEventName,
        eventDate: this.state.newEventDate,
        description: this.state.newEventDescription
      })
      this.setState({
        events: await getEvents(this.props.auth.getIdToken()),
        newEventName: '',
        newEventDescription: '',
      })
    } catch {
      console.log('Could not create the event.')
    } 
    this.setState({
      loadingEvents: false,
      popupCreateEventErrorLabelEventExists: false, 
      popupCreateEventErrorLabelEventName: true
    })
  } 

  onEventDelete = async (event: Event) => {
    try {
      await deleteEvent(this.props.auth.getIdToken(), event.eventId)
        this.setState({
          events: this.state.events.filter(e => e.eventId !== event.eventId)
      })
    } catch {
      alert('Could not delete the event.')
    }
  }

  showDeleteConfirmation = (pos: number) => {
    let confirmDeleteIsopen = [...this.state.confirmDeleteIsopen]
    let item = confirmDeleteIsopen[pos]
    item = !item
    confirmDeleteIsopen[pos] = item
    this.setState({confirmDeleteIsopen})
  }

  handleConfirm = (pos: number, event: Event) => {
    let confirmDeleteIsopen = [...this.state.confirmDeleteIsopen]
    confirmDeleteIsopen[pos] = false
    this.setState({confirmDeleteIsopen})
    this.onEventDelete(event)
  }

  handleCancel = (pos: number) => {
    let confirmDeleteIsopen = [...this.state.confirmDeleteIsopen]
    confirmDeleteIsopen[pos] = false
    this.setState({confirmDeleteIsopen})
  }

  renderDeleteEventButton(pos: number, event: Event) {
    if (event.owner) {
      return (
        <div>
          <Button icon='trash alternate' color='red' onClick={() => this.showDeleteConfirmation(pos)} />
          <Confirm
            open={this.state.confirmDeleteIsopen[pos]}
            onCancel={() => this.handleCancel(pos)}
            onConfirm={() => this.handleConfirm(pos, event)}
            header='This will delete the event for everyone!'
            content='Are you sure you want to delete it?'
            cancelButton='Cancel'
            confirmButton='Delete it'
          />
        </div>
    )} else {
      return (
        <Button color='red' icon='trash alternate' onClick={() => this.onEventDelete(event)} />
      )
    }
  }

  async componentDidMount() {
    try {
      const events = await getEvents(this.props.auth.getIdToken())
      this.setState({
        events,
        loadingEvents: false
      })
    } catch(e: unknown) {
      if (e instanceof Error) {
        alert('Could not fetch events:' + e.message)
      } else {
        alert('Could not fetch events.')
      }
    }
  }

  render() {
    return (
      <div>
        {this.renderCreateEventInput()}
        {this.renderEvents()}
      </div>
    )
  }

  renderCreateEventInput() {
    return (

      <Segment placeholder>
        
        <Grid columns={2} stackable textAlign='center'>

          <Divider vertical>Or</Divider>

          <Grid.Row verticalAlign='middle'>
            <Grid.Column>
              <Header icon>
                <Icon name='plus' />
              </Header>
              {this.createEventButton()}
              
            </Grid.Column>

            <Grid.Column>
              <Header icon>
                <Icon name='share' />
              </Header>
              {this.addEventButton()}
            </Grid.Column>
          </Grid.Row>
          
        </Grid>

      </Segment>
    )
  }

  renderOwnership(event: Event) {
    if (event.owner) {
        return (
          <div>You created this event <ReactTimeAgo date={event.createdDate} /><br /></div>
    )} else {
        return (
          <div>{event.createdBy} created this event <ReactTimeAgo date={event.createdDate} /><br /></div>
    )}
  }

  renderEvents() {
    if (this.state.loadingEvents) {
      return this.renderLoading()
    }

    return this.renderEventsList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline='centered'>
          <h4>FETCHing events</h4>
        </Loader>
      </Grid.Row>
    )
  }

  renderEventsList() {
    var buttonUrl

    return (
      <Grid divided='vertically'>
        <Grid.Row>
        </Grid.Row>
        {this.state.events.sort((a, b) => new Date(b.eventDate).valueOf() - new Date(a.eventDate).valueOf()).reverse().map((event, pos) => {
          
          if (event.attachmentUrl) { buttonUrl = event.attachmentUrl } 
          else { buttonUrl = dummy }

          return (

            <Grid.Row key={event.eventId}>

              <Grid.Column width={3} verticalAlign='middle' floated='right'>

                <div onClick={() => this.onLabelClick(event)} style={{cursor: 'pointer'}} >
                  <Image 
                    src={buttonUrl} 
                    size='small'
                    wrapped 
                  />
                </div>

              </Grid.Column>
              <Grid.Column width={7} verticalAlign='middle'>

                <div onClick={() => this.onLabelClick(event)} style={{cursor: 'pointer'}} >
                  <h2>{event.name}</h2>
                  {event.description && (<h4> {event.description}</h4>)}
                </div>

              </Grid.Column>
              <Grid.Column width={4} floated='right' verticalAlign='middle'>

                <div>Happening <ReactTimeAgo date={event.eventDate} /></div>
                {this.renderOwnership(event)}

              </Grid.Column>
              <Grid.Column width={1} floated='left' verticalAlign='middle'>

                {event.owner && (
                    <Button
                      icon
                      color='blue'
                      onClick={() => this.onEditButtonClick(event)}
                    >
                      <Icon name='pencil' />
                    </Button>
                )}

                {this.renderDeleteEventButton(pos, event)}

              </Grid.Column>

            </Grid.Row>
          )
        }
      )}
      </Grid>
    )
  }
}
