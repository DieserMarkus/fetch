import * as React from 'react'
import Auth from '../auth/Auth'
import { Button, Container, Segment, Grid, Divider, Header, Icon, Image } from 'semantic-ui-react'
import imageCreateOrAdd from '../img/CreateOrAdd.png'
import imageEvents from '../img/Events.png'
import imageItems from '../img/Items.png'

interface LogInProps {
  auth: Auth
}

interface LogInState {}

export class LogIn extends React.PureComponent<LogInProps, LogInState> {
  onLogin = () => {
    this.props.auth.login()
  }

  render() {
    return (
      <Container textAlign='center'>


          <Segment placeholder>
            <Grid columns={2} stackable>

              <Grid.Row verticalAlign='middle'>
                <Grid.Column>
                  <Header icon>
                    <Icon name='calendar' />
                    Create upcoming events ...
                  </Header>
                </Grid.Column>

                <Grid.Column>
                  <Image 
                    src={imageEvents} 
                    rounded
                    bordered />
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Segment>

          <Segment placeholder>
            <Grid columns={2} stackable>

              <Grid.Row verticalAlign='middle'>
                <Grid.Column>
                  <Header icon>
                    <Icon name='plus' />
                    ... add items someone should bring along ...
                  </Header>
                </Grid.Column>

                <Grid.Column>
                  <Image 
                    src={imageItems} 
                    rounded
                    bordered />
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Segment>

          <Segment placeholder>
            <Grid columns={2} stackable>

              <Grid.Row verticalAlign='middle'>
                <Grid.Column>
                  <Header icon>
                    <Icon name='share' />
                    ... and work on the list with your friends
                  </Header>
                </Grid.Column>

                <Grid.Column>
                  <Image 
                    src={imageCreateOrAdd} 
                    rounded
                    bordered />
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Segment>

        <Divider clearing hidden />

        <Button onClick={this.onLogin} size='huge' color='red' >
          Log in or create an account
        </Button>
        
      </Container>
    )
  }
}
