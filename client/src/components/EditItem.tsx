import * as React from 'react'
import { Form, Button, Divider, Header, Icon, Input } from 'semantic-ui-react'
import Auth from '../auth/Auth'
import { getUploadUrl, patchItem, uploadFile } from '../api/items-api'

enum UploadState {
  NoUpload,
  FetchingPresignedUrl,
  UploadingFile
}

interface EditItemProps {
  match: {
    params: {
      itemId: string,
      eventId: string
    }
  }
  location: {
    state: any
  }
  auth: Auth
}

interface EditItemState {
  file: any
  uploadState: UploadState
  saveState: boolean
  newItemName: string
}

export class EditItem extends React.PureComponent<
  EditItemProps,
  EditItemState
> {
  state: EditItemState = {
    file: undefined,
    uploadState: UploadState.NoUpload,
    saveState: false,
    newItemName: this.props.location.state.item.eventName
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newItemName: event.target.value })
  }

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    this.setState({ file: files[0] })
  }

  handleSubmit = async (reactEvent: React.SyntheticEvent) => {
    try {
      this.setState({ saveState: true })
      reactEvent.preventDefault()

      await patchItem(this.props.auth.getIdToken(), this.props.location.state.item.itemId, this.props.location.state.event.eventId, {
        name: this.state.newItemName,
        done: (this.props.location.state.item.done ? this.props.location.state.item.done : false)
      })
      alert('Successfully saved.')
    } catch(e: unknown) {
      if (e instanceof Error) {
        alert('Could not save changes.' + e.message)
      } else {
        alert('Could not save changes.')
      }
    } finally {
      this.setState({ saveState: false })
    }
  }

  handleUploadSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      if (!this.state.file) {
        alert('Select an image first.')
        return
      }

      this.setUploadState(UploadState.FetchingPresignedUrl)
      const uploadUrl = await getUploadUrl(this.props.auth.getIdToken(), this.props.match.params.itemId, this.props.match.params.eventId)

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
        <h1>{this.props.location.state.item.name}</h1>
        <h4>For {this.props.location.state.event.name}</h4>

        <Divider horizontal>
          <Header as='h4'>
            <Icon name='bullseye' />
              Item Information
          </Header>
        </Divider>

        <Form onSubmit={this.handleSubmit}>
          <Form.Field>
            <label>Name</label>
            <Input
              style={{width: '100%'}}
              type='string'
              onChange={this.handleNameChange}
              defaultValue={this.props.location.state.item.name}
            />
          </Form.Field>

          {this.renderSaveButton()}
        </Form>

        <Divider horizontal>
          <Header as='h4'>
            <Icon name='image' />
              Item Image
          </Header>
        </Divider>

        <Form onSubmit={this.handleUploadSubmit}>
          <Form.Field>
            <label>File</label>
            <Input
              type='file'
              accept='image/*'
              placeholder='Image to upload'
              onChange={this.handleFileChange}
            />
          </Form.Field>

          {this.renderUploadButton()}
        </Form>
      </div>
    )
  }

  renderUploadButton() {
    return (
      <div>
        {this.state.uploadState === UploadState.FetchingPresignedUrl && <p>Uploading image metadata</p>}
        {this.state.uploadState === UploadState.UploadingFile && <p>Uploading file</p>}
        <Button loading={this.state.uploadState !== UploadState.NoUpload} type='submit'>
          Upload
        </Button>
      </div>
    )
  }

  renderSaveButton() {
    return (
      <div>
        <Button loading={this.state.saveState} type='submit'>
          Save changes
        </Button>
      </div>
    )
  }
}
