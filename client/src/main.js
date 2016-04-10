// @flow
import React from 'react'
import { render } from 'react-dom'
import { createStore, compose, applyMiddleware } from 'redux'
import { Provider, connect } from 'react-redux'
import UUID from 'uuid-js'

import 'normalize.css/normalize.css'
import 'font-awesome/css/font-awesome.css'
import './main.styl'


// States
type Message = string;
type Channel = Map<string, Message>;
const new_channel = (): Channel => new Map;

type State = {
  channels: { [name: string]: Channel },
  current_channel: string
};
const init: State = (_ => {
  // Accept permalink
  const names = ['general', 'random', 'notice'];
  const channels: Object = names.map(k => ({[k]: new_channel()})).reduce((l, r) => Object.assign(l, r))

  let init = location.hash.slice(1);
  if (!init) { init = 'general'; }
  if (!(init in channels)) { channels[init] = new_channel(); }

  return { channels, current_channel: init };
})();

type Action = {
  type: 'CreateMsg'|'ReceiveMsg'|'CreateChannel'|'ChangeChannel',
  channel: string,
  msg_id?: string,  // Only used with 'CreateMsg'|'ReceiveMsg'
  msg?: Message,    // Only used with 'CreateMsg'|'ReceiveMsg'
};
type Dispatch = (action: Action) => Action;

const reducer = (state: State = init, action: Action): State => {
  const { type, channel: ch } = action;

  switch (type) {
  case 'CreateMsg':
  case 'ReceiveMsg': {
    // Validate action
    const { msg_id, msg } = action;
    if (msg_id == null || msg == null) { return state; }

    const next = Object.assign({}, state);

    // 내가 모르는 채널에서 메세지가 올 경우, 그 채널을 추가
    if (next.channels[ch] == null) {
      next.channels[ch] = new_channel();
    }

    next.channels[ch].set(msg_id, msg);
    return next; }
  case 'CreateChannel': {
    if (ch in state.channels) { return state; }

    const next = Object.assign({}, state);
    next.channels[ch] = new_channel();
    return next; }
  case 'ChangeChannel':
    return { channels: state.channels, current_channel: ch };
  default:
    return state;
  }
}

// Communication (1)
const socket = new WebSocket(`ws://${location.host}/api`);

// 어플리케이션 에서 내부적으로 'CreateMsg' 이벤트가 발생하였을경우, 타입만
// 'ReceiveMsg' 로 바꾼뒤 그대로 직렬화하여 서버로 전송한다.
const server = store => next => action => {
  if (action.type === 'CreateMsg') {
    const newaction = Object.assign({}, action);
    newaction.type = 'ReceiveMsg';
    socket.send(JSON.stringify(newaction));
  }
  return next(action);
};

// View
type Props = {
  state: State,
  createMsg: (channel: string, msg: string) => Action,
  createChannel: (channel: string) => Action,
  changeChannel: (channel: string) => Action,
};

const ChannelView = (() => {
  let elem;
  return React.createClass({
    componentDidUpdate(params) {
      // TODO: 남이 메세지를 보냈을때도 스크롤이 확확 올라가버리면 곤란함
      elem.scrollTop = elem.scrollHeight - elem.clientHeight;
    },
    render() {
      const lines = [];
      const channel: Channel = this.props.channel;
      for (const [id, msg] of channel) {
        lines.push(<li key={id}>
          <span className='nick'>오리너구리</span>
          <span className='content'>{msg}</span>
          <span className='control'>
            <i className='fa fa-pencil'/>
            &nbsp;
            <i className='fa fa-trash-o'/>
          </span>
        </li>);
      }
      return <ul ref={n=>elem=n}>{lines}</ul>;
    }
  });
})();

const View = ({ state, createMsg, createChannel, changeChannel }: Props) => {
  let field_channel, field;

  const onSubmit = e => {
    e.preventDefault();
    if (!field.value) { return; }

    createMsg(state.current_channel, field.value);
    field.value = '';
  };

  const onCreateChannel = e => {
    e.preventDefault();
    const ch = field_channel.value;
    if (!ch) { return; }
    field_channel.value = ''

    createChannel(ch);
    changeChannel(ch);
  }

  return <div id='chat'>
    <div id='channels'>
      <form onSubmit={onCreateChannel}>
        <input className='field' placeholder='새 채널' ref={n=>field_channel=n}/>
      </form>
      <ul>
        { Object.keys(state.channels).map(ch => (
          <li id={ch === state.current_channel ? 'current' : null}
            key={ch} onClick={_ => changeChannel(ch)}>{ch}</li>
        )) }
      </ul>
    </div>
    <div id='buffer'>
      <ChannelView channel={state.channels[state.current_channel]}/>
      <form onSubmit={onSubmit}>
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
  createMsg: (channel, msg) => dispatch({
    type: 'CreateMsg', channel, msg,
    msg_id: UUID.create().toString(),
  }),
  createChannel: channel => dispatch({ type: 'CreateChannel', channel }),
  changeChannel: channel => dispatch({ type: 'ChangeChannel', channel }),
});
const App = connect(mapState, mapDispatch)(View);

const store = createStore(reducer, compose(
  applyMiddleware(server),
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

// Communication (2)
socket.onmessage = event => {
  // 서버로부터 전달받은 action 객체를 그대로 dispatch 한다
  store.dispatch(JSON.parse(event.data));
}

// Generate permalink
store.subscribe(() => {
  location.hash = store.getState().current_channel;
});


// Entry Point
render(
  <Provider store={store}>
    <App/>
  </Provider>,
  document.getElementById('target')
);
