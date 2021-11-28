import ReactDOM from 'react-dom'
import './index.css'
import * as serviceWorker from './serviceWorker'
import 'semantic-ui-css/semantic.min.css'
import { makeAuthRouting } from './routing';

import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en.json'
import de from 'javascript-time-ago/locale/de.json'

TimeAgo.addDefaultLocale(en)
TimeAgo.addLocale(de)

ReactDOM.render(makeAuthRouting(), document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
