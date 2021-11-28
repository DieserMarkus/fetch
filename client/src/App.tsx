import { Component } from 'react'
import { Route, Router, Switch } from 'react-router-dom'
import { Grid, Menu, Segment, Divider, Header } from 'semantic-ui-react'
import Auth from './auth/Auth'
import { Location, History } from 'history'
import { EditItem } from './components/EditItem'
import { EditEvent } from './components/EditEvent'
import { LogIn } from './components/LogIn'
import { NotFound } from './components/NotFound'
import { Items } from './components/Items'
import { Event } from './types/Event'
import { Events } from './components/Events'
import { ReactComponent as Logo } from './logo.svg';

export interface AppProps {
  auth: Auth
  location: Location
  history: History
}

export interface AppState { }

export default class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props)
    this.handleLogin = this.handleLogin.bind(this)
    this.handleLogout = this.handleLogout.bind(this)
    this.redirectHome = this.redirectHome.bind(this)
    this.redirectToEvent = this.redirectToEvent.bind(this)
  }

  state: AppState = { }

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

  render() {
    return (
      <div>
        
        <Segment style={{ padding: '4em 0em' }} vertical>
          <Grid container stackable verticalAlign="middle">
          <Grid.Row fullWidth>
            <Divider clearing hidden />
              <Logo height="100" />
              <Header as="h1">FETCH: A little helper for your events</Header>
            <Divider clearing hidden />
          </Grid.Row>
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
          {this.logInLogOutButton()}
        </Menu.Menu>
      </Menu>
    )
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