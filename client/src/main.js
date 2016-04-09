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
  channels: { '#general': [], '#random': [], '#notice': [] },
  current_channel: '#general'
};

type Action = {
  type: 'SubmitMsg'|'ReceiveMsg'|'ChangeChannel',
  channel: string,
  message?: string // Only used with 'SubmitMsg'|'ReceiveMsg'
};
type Dispatch = (action: Action) => Action;

const reducer = (state: State = init, action: Action): State => {
  switch (action.type) {
  case 'SubmitMsg':
    return state;
  case 'ReceiveMsg':
    // Validate action
    const msg = action.message;
    if (msg == null) { return state; }

    const newstate = Object.assign({}, state);
    const channel = newstate.channels[action.channel];
    channel.push(msg);
    return newstate;
  case 'ChangeChannel':
    return { channels: state.channels, current_channel: action.channel };
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
  changeChannel: (channel: string) => Action,
};

const View = ({ state, submit, changeChannel }: Props) => {
  let field_channel, lines, field;

  const newMessage = e => {
    e.preventDefault();
    submit(state.current_channel, field.value);
    field.value = '';
    lines.scrollTop = lines.scrollHeight - lines.clientHeight; // TODO: Fix
  };

  const newChannel = e => {
    e.preventDefault();
    // TODO: Create new channel
    field_channel.value = ''
  }

  return <div id='chat'>
    <div id='channels'>
      <form onSubmit={newChannel}>
        <input className='field' placeholder='새 채널' ref={n=>field_channel=n}/>
      </form>
      <ul>
        { Object.keys(state.channels).map(ch => (
          <li id={ch === state.current_channel ? 'current' : null}
            onClick={_ => changeChannel(ch)}>{ch}</li>
        )) }
      </ul>
    </div>
    <div id='buffer'>
      <ul ref={n=>lines=n}>
        { state.channels[state.current_channel].map(line => <li>{line}</li>) }
      </ul>
      <form onSubmit={newMessage}>
        <input className='field' placeholder='친구들과 이야기하세요!' ref={n=>field=n}/>
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
  changeChannel: channel => dispatch({ type: 'ChangeChannel', channel }),
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
