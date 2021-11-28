import { Component } from 'react'
import { Route, Router, Switch } from 'react-router-dom'
import { Grid, Menu, Segment, Divider, Popup, Button, Input } from 'semantic-ui-react'
import Auth from './auth/Auth'
import { Location, History } from 'history'
import { EditItem } from './components/EditItem'
import { EditEvent } from './components/EditEvent'
import { LogIn } from './components/LogIn'
import { NotFound } from './components/NotFound'
import { Items } from './components/Items'
import { Event } from './types/Event'
import { Events } from './components/Events'
import { addEvent } from './api/events-api'

//import { ReactComponent as Logo } from './logo.svg';
//<Logo height="30" />

export interface AppProps {
  auth: Auth
  location: Location
  history: History
}

export interface AppState {
  popupAddEventIsOpen: boolean
  eventCode: string
}

export default class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props)
    this.handleLogin = this.handleLogin.bind(this)
    this.handleLogout = this.handleLogout.bind(this)
    this.redirectHome = this.redirectHome.bind(this)
    this.redirectToEvent = this.redirectToEvent.bind(this)
  }

  state: AppState = {
    popupAddEventIsOpen: false,
    eventCode: ''
  }

  handleLogin() {
    this.props.auth.login()
  }

  handleLogout() {
    this.props.auth.logout()
  }

  redirectHome() {
    this.props.history.push('/')
  }

  redirectToEvent(event: Event) {
    this.props.history.push({ 
      pathname: `/events/${event.eventId}/items`,
      state: { 
        event: event
      }
    })
  }

  addExistingEvent = async (eventId: string) => {

    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(this.state.eventCode)) {
      alert('Please enter a valid Event ID.')
      return
    }

    try {

      await addEvent(this.props.auth.getIdToken(), this.state.eventCode)

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
      position='bottom left'
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

  render() {
    return (
      <div>
        
        <Segment style={{ padding: '4em 0em' }} vertical>
          <Grid container stackable verticalAlign="middle">
            <Grid.Row>
              <Grid.Column width={16}>
                <Router history={this.props.history}>
                  {this.generateMenu()}
                  <Divider clearing hidden />
                  {this.generateCurrentPage()}
                </Router>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>

      </div>
    )
  }

  generateMenu() {
    const { event } = this.props.location.state as any || {event: { event: "" }}
    return (
      <Menu>

        <Menu.Item name="Home" onClick={this.redirectHome} />

        {this.props.location.pathname.includes("events") && ( 
        <Menu.Item name="Event" onClick={() => this.redirectToEvent(event)}>
          {event.name}
        </Menu.Item>
        )}

        {this.props.location.pathname.endsWith("edit") && ( <Menu.Item name="Edit" /> )}

        <Menu.Menu position="right">

          {this.addEventButton()}
          {this.logInLogOutButton()}

        </Menu.Menu>
      </Menu>
    )
  }

  addEventButton() {
    if (this.props.auth.isAuthenticated()) {
      return (
        <Menu.Item position="right">
          {this.renderAddEventWithPopUp()}
        </Menu.Item>
      )
    }
  }

  logInLogOutButton() {
    if (this.props.auth.isAuthenticated()) {
      return (
        <Menu.Item name="logout" onClick={this.handleLogout}>
          Log Out
        </Menu.Item>
      )
    } else {
      return (
        <Menu.Item name="login" onClick={this.handleLogin}>
          Log In
        </Menu.Item>
      )
    }
  }

  generateCurrentPage() {
    if (!this.props.auth.isAuthenticated()) {
      return <LogIn auth={this.props.auth} />
    }

    return (
      <Switch>
        <Route
          path="/"
          exact
          render={props => {
            return <Events {...props} auth={this.props.auth} />
          }}
        />

        <Route
          path="/events/:eventId/edit"
          exact
          render={props => {
            return <EditEvent {...props} auth={this.props.auth} />
          }}
        />

        <Route
          path="/events/:eventId/items"
          exact
          render={props => {
            return <Items {...props} auth={this.props.auth} />
          }}
        />

        <Route
          path="/events/:eventId/items/:itemId/edit"
          exact
          render={props => {
            return <EditItem {...props} auth={this.props.auth} />
          }}
        />

        <Route component={NotFound} />
      </Switch>
    )
  }
}