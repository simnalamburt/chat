// @flow
import React from 'react'
import { render } from 'react-dom'
import { createStore, compose, applyMiddleware } from 'redux'
import { Provider, connect } from 'react-redux'

import 'normalize.css/normalize.css'
import './main.styl'

// States
type State = {
  channels: { [name: string]: Array<string> },
  current_channel: string
};
const init: State = {
  channels: { '#general': [] },
  current_channel: '#general'
};

type Action = {
  type: 'SubmitMsg'|'ReceiveMsg',
  channel: string,
  message: string
};
type Dispatch = (action: Action) => Action;

const reducer = (state: State = init, action: Action): State => {
  switch (action.type) {
  case 'SubmitMsg':
    return state;
  case 'ReceiveMsg':
    const newstate = Object.assign({}, state);
    const channel = newstate.channels[action.channel];
    channel.push(action.message);
    return newstate;
  default:
    return state;
  }
}

// Communication (1)
const socket = new WebSocket(`ws://${location.host}/api`);
const server = store => next => action => {
  if (action.type === 'SubmitMsg') {
    socket.send(JSON.stringify({
      type: 'SubmitMsg',
      channel: action.channel,
      message: action.message
    }));
  }
  return next(action);
};

// View
type Props = {
  state: State,
  submit: (channel: string, message: string) => Action,
};

const View = ({ state, submit }: Props) => {
  let lines, field;
  const onSubmit = e => {
    e.preventDefault();
    submit(state.current_channel, field.value);
    field.value = '';
    lines.scrollTop = lines.scrollHeight - lines.clientHeight; // TODO: Fix
  };

  const channel = state.channels[state.current_channel];

  return <div id='chat'>
    <ul id='channels'>
      { Object.keys(state.channels).map(ch => <li>{ch}</li>) }
    </ul>
    <div id='buffer'>
      <ul ref={n=>lines=n}>
        { channel.map(line => <li>{line}</li>) }
      </ul>
      <form onSubmit={onSubmit}>
        <input placeholder='친구들과 이야기하세요!' ref={n=>field=n}/>
      </form>
    </div>
  </div>;
};

// App
type StateProps = { state: State };
type DispatchProps = $Diff<Props, StateProps>;

const mapState = (state: State): StateProps => ({ state });
const mapDispatch = (dispatch: Dispatch): DispatchProps => ({
  submit: (channel, message) => dispatch({ type: 'SubmitMsg', channel, message }),
});
const App = connect(mapState, mapDispatch)(View);

const store = createStore(reducer, compose(
  applyMiddleware(server),
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

// Communication (2)
socket.onmessage = event => {
  const { type, channel, message } = JSON.parse(event.data);
  if (type !== 'SubmitMsg') { return; }

  store.dispatch({ type: 'ReceiveMsg', channel, message });
}


// Entry Point
render(
  <Provider store={store}>
    <App/>
  </Provider>,
  document.getElementById('target')
);
