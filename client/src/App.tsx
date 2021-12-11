import { Component } from 'react'
import { Route, Router, Switch } from 'react-router-dom'
import { Grid, Menu, Segment, Divider, Image, Container, List, Icon } from 'semantic-ui-react'
import Auth from './auth/Auth'
import { Location, History } from 'history'
import { EditItem } from './components/EditItem'
import { EditEvent } from './components/EditEvent'
import { LogIn } from './components/LogIn'
import { NotFound } from './components/NotFound'
import { Items } from './components/Items'
import { Event } from './types/Event'
import { Item } from './types/Item'
import { Events } from './components/Events'
import Logo from './img/Logo.png'

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

  redirectToItem(event: Event, item: Item) {
    this.props.history.push({ 
      pathname: `/events/${item.eventId}/items/${item.itemId}/edit`,
      state: { 
        event: event,
        item: item
      }
    })
  }

  render() {

    var style = {
      textAlign: 'center',
      padding: '20px',
      position: 'fixed',
      left: '0',
      bottom: '0',
      height: '60px',
      width: '100%'
    }
    
    return (
      <div>
        <Divider clearing hidden />
        <Grid container stackable verticalAlign='middle'>
          <Grid.Row>
            <Image 
              src={Logo} 
              size='large' 
              centered 
              onClick={this.redirectHome} 
              style={{cursor: 'pointer'}} />
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <Router history={this.props.history}>
                {this.generateMenu()}
                
                {this.generateCurrentPage()}
              </Router>
            </Grid.Column>
          </Grid.Row>
         </Grid>

        <Segment inverted style={style}>
          <Container textAlign='center'>
            Made with &nbsp; <Icon name='heart' color='red' /> and &nbsp; <Icon name='coffee' color='brown' /> &nbsp; for Udacity Cloud Developer Nanodegree by &#102;&#101;&#116;&#099;&#104;[at]&#109;&#052;&#114;&#107;&#117;&#115;&#046;&#099;&#111;&#109;
          </Container>
          <Container textAlign='center'>
            <List horizontal inverted divided link size='small'>
              <List.Item as='a' href='https://auth0.com/'>
                auth0
              </List.Item>
              <List.Item as='a' href='https://www.serverless.com/'>
                serverless
              </List.Item>
              <List.Item as='a' href='https://github.com/DieserMarkus'>
                github
              </List.Item>
              <List.Item as='a' href='https://reactjs.org/'>
                reactjs
              </List.Item>
              <List.Item as='a' href='https://www.typescriptlang.org/'>
                typescript
              </List.Item>
              <List.Item as='a' href='https://nodejs.org/en/'>
                nodejs
              </List.Item>
              <List.Item as='a' href='https://aws.amazon.com/lambda/'>
                aws lambda
              </List.Item>
              <List.Item as='a' href='https://aws.amazon.com/dynamodb'>
                aws dynamodb
              </List.Item>
            </List>
          </Container>
        </Segment>

      </div>
    )
  }

  generateMenu() {
    const { event } = this.props.location.state as any || {event: { event: '' }}
    const { item } = this.props.location.state as any || {item: { item: '' }}

    return (
      <Menu>

        <Menu.Item name='Home' onClick={this.redirectHome} />

        {event && event.eventId && ( <Menu.Item onClick={() => this.redirectToEvent(event)}> {event.name} </Menu.Item> )}

        {item && item.itemId && ( <Menu.Item onClick={() => this.redirectToItem(event, item)}>  {item.name} </Menu.Item>)}

        {this.props.location.pathname.endsWith('edit') && ( <Menu.Item name='Edit' /> )}

        <Menu.Menu position='right'>
          {this.logInLogOutButton()}
        </Menu.Menu>
      </Menu>
    )
  }

  logInLogOutButton() {
    if (this.props.auth.isAuthenticated()) {
      return (
        <Menu.Item name='logout' onClick={this.handleLogout}>
          Log Out
        </Menu.Item>
      )
    } else {
      return (
        <Menu.Item name='login' onClick={this.handleLogin}>
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
          path='/'
          exact
          render={props => {
            return <Events {...props} auth={this.props.auth} />
          }}
        />

        <Route
          path='/events/:eventId/edit'
          exact
          render={props => {
            return <EditEvent {...props} auth={this.props.auth} />
          }}
        />

        <Route
          path='/events/:eventId/items'
          exact
          render={props => {
            return <Items {...props} auth={this.props.auth} />
          }}
        />

        <Route
          path='/events/:eventId/items/:itemId/edit'
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