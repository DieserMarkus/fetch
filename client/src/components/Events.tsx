import { History } from 'history'
import React from "react"
import { Button, Divider, Grid, Icon, Input, Image, Loader, Confirm, Segment, Popup }  from 'semantic-ui-react'
import ReactTimeAgo from 'react-time-ago'
import { createEvent, deleteEvent, getEvents, addEvent } from '../api/events-api'
import Auth from '../auth/Auth'
import dummy from '../dummy.png'
import { Event } from '../types/Event'
import DatePicker from "react-datepicker"
import de from 'date-fns/locale/de'
import "react-datepicker/dist/react-datepicker.css"
import { registerLocale } from  "react-datepicker"
registerLocale('de', de)

interface EventsProps {
  auth: Auth
  history: History
}

interface EventsState {
  events: Event[]
  newEventName: string
  newEventDate: Date
  newEventDescription: string
  loadingEvents: boolean
  confirmDeleteIsopen: boolean[]
  popupAddEventIsOpen: boolean
  eventCode: string
}

export class Events extends React.PureComponent<EventsProps, EventsState> {
  state: EventsState = {
    events: [],
    newEventName: '',
    newEventDate: new Date(),
    newEventDescription: '',
    loadingEvents: true,
    confirmDeleteIsopen: [false],
    popupAddEventIsOpen: false,
    eventCode: ''
  }

  addExistingEvent = async (eventId: string) => {

    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(this.state.eventCode)) {
      this.setState({ eventCode: '', popupAddEventIsOpen: false })
      alert('Please enter a valid Event ID.')
      return
    }

    if (this.state.events.some(e => e.eventId === this.state.eventCode)) {
      this.setState({ eventCode: '', popupAddEventIsOpen: false })
      alert('This event is already in your list.')
      return
    }

    try {

      await addEvent(this.props.auth.getIdToken(), this.state.eventCode)

      this.setState({
        events: await getEvents(this.props.auth.getIdToken()),
        eventCode: '',
        popupAddEventIsOpen: false
      })

    } catch(e: unknown) {
      if (e instanceof Error) {
        alert('Could not add the event.' + e.message)
      } else {
        alert('Could not add the event.')
      }
    }

  }

  handlePopupAddEventOpen = () => {
    this.setState({ popupAddEventIsOpen: true })
  }

  handlePopupAddEventClose = () => {
    this.setState({ popupAddEventIsOpen: false })
  }

  handleEventCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ eventCode: event.target.value })
  }

  renderAddEventWithPopUp() {
    return (
      <Popup
      trigger={<Button color="green" icon="add to calendar" />}
      on='click'
      open={this.state.popupAddEventIsOpen}
      onClose={this.handlePopupAddEventClose}
      onOpen={this.handlePopupAddEventOpen}
      position='bottom right'
    >
      <Popup.Header>
        <span>You received an event code?</span>
      </Popup.Header>
      <Popup.Content>
        <p>Enter it here to add it to your list: </p>
        <Input
          style={{width: "100%"}}
          type="string"
          onChange={this.handleEventCodeChange}
          defaultValue={this.state.eventCode}
          placeholder="Event Code" 
        />
        <Divider clearing hidden />
        <Button 
          color="green" 
          icon="plus square" 
          style={{width: "100%"}} 
          onClick={() => this.addExistingEvent(this.state.eventCode)} 
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
    });
  }

  onLabelClick = (event: Event) => {
    this.props.history.push({ 
      pathname: `/events/${event.eventId}/items`,
      state: { 
        event: event
      }
    });
  }

  onEventCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      await createEvent(this.props.auth.getIdToken(), {
        name: this.state.newEventName,
        eventDate: this.state.newEventDate,
        description: this.state.newEventDescription
      })
      this.setState({
        events: await getEvents(this.props.auth.getIdToken()),
        newEventName: '',
        newEventDescription: ''
      })
    } catch {
      alert('Could not create the event.')
    }
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

  show = (pos: number) => {
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
          <Button icon="trash alternate" color="red" onClick={() => this.show(pos)} />
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
        <Button color="red" icon="trash alternate" onClick={() => this.onEventDelete(event)} />
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
      <Segment padded>

        <Grid padded>
          <Grid.Row>

            <Grid.Column width={5}>
              <Input
                action={{
                  color: 'teal',
                  labelPosition: 'left',
                  icon: 'add',
                  content: 'Add Event',
                  onClick: this.onEventCreate
                }}
                actionPosition="left"
                placeholder="Lets go to..."
                style={{width: "100%"}}
                onChange={this.handleNameChange}
              />
            </Grid.Column>

            <Grid.Column width={5}>
              <Input
                placeholder="Add a description"
                onChange={this.handleDescriptionChange}
                style={{width: "100%"}}
              />
            </Grid.Column>

            <Grid.Column width={5}>
              <div className="customDatePickerWidth">
                <DatePicker 
                  minDate={new Date()}
                  selected={this.state.newEventDate}
                  onChange={this.handleDateChange}
                  locale="de"
                  showTimeSelect
                  timeFormat="p"
                  timeIntervals={15}
                  dateFormat="Pp"
                  placeholderText="Pick a Date"
                />
              </div>
            </Grid.Column>
            <Grid.Column width={1}>
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
        <Loader indeterminate active inline="centered">
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
                  <Grid.Column width={3} verticalAlign="middle" floated="right">

                    <div onClick={() => this.onLabelClick(event)} style={{cursor: 'pointer'}} >
                      <Image 
                        src={buttonUrl} 
                        size="small" 
                        wrapped 
                      />
                    </div>

                  </Grid.Column>
                  <Grid.Column width={7} verticalAlign="middle">

                    <div onClick={() => this.onLabelClick(event)} style={{cursor: 'pointer'}} >
                      <h2>{event.name}</h2>
                      {event.description && (<h4> {event.description}</h4>)}
                    </div>

                  </Grid.Column>
                  <Grid.Column width={4} floated="right" verticalAlign="middle">

                    <div>Happening <ReactTimeAgo date={event.eventDate} /></div>
                    {this.renderOwnership(event)}

                  </Grid.Column>
                  <Grid.Column width={1} floated="left" verticalAlign="middle">

                      {event.owner && (
                          <Button
                            icon
                            color="blue"
                            onClick={() => this.onEditButtonClick(event)}
                          >
                            <Icon name="pencil" />
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
