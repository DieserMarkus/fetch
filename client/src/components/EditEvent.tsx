import * as React from 'react'
import { Form, Button, Divider, Header, Icon, Input } from 'semantic-ui-react'
import Auth from '../auth/Auth'
import { History } from 'history'
import { getUploadUrl, uploadFile, patchEvent } from '../api/events-api'
import DatePicker from "react-datepicker"
import de from 'date-fns/locale/de'
import "react-datepicker/dist/react-datepicker.css"
import { registerLocale } from  "react-datepicker"
registerLocale('de', de)

enum UploadState {
  NoUpload,
  FetchingPresignedUrl,
  UploadingFile
}

interface EditEventProps {
  match: {
    params: {
      eventId: string
    }
  }
  location: {
    state: any
  }
  history: History
  auth: Auth
}

interface EditEventState {
  file: any
  uploadState: UploadState
  saveState: boolean
  newEventName: string
  newEventDescription: string
  newEventDate: Date
}

export class EditEvent extends React.PureComponent<
  EditEventProps,
  EditEventState
> {
  state: EditEventState = {
    file: undefined,
    uploadState: UploadState.NoUpload,
    saveState: false,
    newEventName: this.props.location.state.event.eventName,
    newEventDescription: this.props.location.state.event.eventDescription,
    newEventDate: this.props.location.state.event.eventDate
  }

  handleFileChange = (reactEvent: React.ChangeEvent<HTMLInputElement>) => {
    const files = reactEvent.target.files
    if (!files) return

    this.setState({
      file: files[0]
    })
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

  handleCopy = () => {
    navigator.clipboard.writeText(this.props.location.state.event.eventId)
  }

  handleSubmit = async (reactEvent: React.SyntheticEvent) => {
    this.setState({ saveState: true })
    try {
      reactEvent.preventDefault()
      await patchEvent(this.props.auth.getIdToken(), this.props.location.state.event.eventId, {
        name: this.state.newEventName,
        description: this.state.newEventDescription,
        eventDate: this.state.newEventDate
      })
      alert('Successfully saved.')
    } catch {
      alert('Could not save changes.')
    } finally {
      this.setState({ saveState: false })
    }
  }

  handleUploadSubmit = async (reactEvent: React.SyntheticEvent) => {
    reactEvent.preventDefault()

    try {
      if (!this.state.file) {
        alert('Select an image first.')
        return
      }

      this.setUploadState(UploadState.FetchingPresignedUrl)
      const uploadUrl = await getUploadUrl(this.props.auth.getIdToken(), this.props.match.params.eventId)

      this.setUploadState(UploadState.UploadingFile)
      await uploadFile(uploadUrl, this.state.file)

      alert('Successfully added the image.')
    } catch(e: unknown) {
      if (e instanceof Error) {
        alert('Could not upload the image: ' + e.message)
      } else {
        alert('Could not upload the image.')
      }
    } finally {
      this.setUploadState(UploadState.NoUpload)
    }
  }

  setUploadState(uploadState: UploadState) {
    this.setState({
      uploadState
    })
  }

  render() {
    return (
      <div>
        <h1>{this.props.location.state.event.name}</h1>

        <Divider horizontal>
          <Header as='h4'>
            <Icon name='bullseye' />
              Event Information
          </Header>
        </Divider>

        <Form onSubmit={this.handleSubmit}>
          <Form.Field>
            <label>Name</label>
            <Input
              style={{width: "100%"}}
              type="string"
              onChange={this.handleNameChange}
              defaultValue={this.props.location.state.event.name}
            />
          </Form.Field>

          <Form.Field>
            <label>Description</label>
            <Input
              style={{width: "100%"}}
              type="string"
              onChange={this.handleDescriptionChange}
              defaultValue={this.props.location.state.event.description}
            />
          </Form.Field>
        
          <Form.Field>
            <label>Date</label>
            <DatePicker 
              minDate={new Date()}
              selected={this.state.newEventDate ? new Date(this.state.newEventDate) : null} 
              onChange={this.handleDateChange}
              locale="de"
              showTimeSelect
              timeFormat="p"
              timeIntervals={15}
            />
          </Form.Field>

          {this.renderSaveButton()}
        </Form>
        
        <Divider horizontal>
          <Header as='h4'>
            <Icon name='image' />
              Event Image
          </Header>
        </Divider>
        
        <Form onSubmit={this.handleUploadSubmit}>
          <Form.Field>
            <label>File</label>
            <Input
              type="file"
              accept="image/*"
              placeholder="Image to upload"
              onChange={this.handleFileChange}
            />
          </Form.Field>

          {this.renderUploadButton()}
        </Form>

        <Divider horizontal>
          <Header as='h4'>
            <Icon name='share square' />
              Share this Event
          </Header>
        </Divider>

        <Input
          action={{
            color: 'teal',
            labelPosition: 'right',
            icon: 'copy',
            content:'Copy',
            onClick: () => this.handleCopy()
          }}
          labelPosition='left'
          style={{width: "100%"}}
          readOnly 
          value={this.props.match.params.eventId}
        />
      
      </div>
    )
  }

  renderUploadButton() {
    return (
      <div>
        {this.state.uploadState === UploadState.FetchingPresignedUrl && <p>Uploading image metadata</p>}
        {this.state.uploadState === UploadState.UploadingFile && <p>Uploading file</p>}
        <Button loading={this.state.uploadState !== UploadState.NoUpload} type="submit">
          Upload
        </Button>
      </div>
    )
  }

  renderSaveButton() {
    return (
      <div>
        <Button loading={this.state.saveState} type="submit">
          Save changes
        </Button>
      </div>
    )
  }
}
