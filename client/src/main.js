// @flow
import React from 'react'
import { render } from 'react-dom'
import { createStore, compose, applyMiddleware } from 'redux'
import { Provider, connect } from 'react-redux'
import UUID from 'uuid-js'

import 'normalize.css/normalize.css'
import 'font-awesome/css/font-awesome.css'
import './main.styl'


//
// States
//
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
  if (!init) { location.hash = init = 'general'; }
  if (!(init in channels)) { channels[init] = new_channel(); }

  return { channels, current_channel: init };
})();

type Action = {
  type: 'UpdateMsg'|'CreateChannel'|'ChangeChannel',
  channel: string,
  msg_id?: string,  // Only used with 'UpdateMsg'
  msg?: Message,    // Only used with 'UpdateMsg'
};
type Dispatch = (action: Action) => Action;

const reducer = (state: State = init, action: Action): State => {
  const { type, channel: ch } = action;

  switch (type) {
  case 'UpdateMsg': {
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


//
// View
//
type Props = {
  state: State,
  updateMsg: (channel: string, msg: string, msg_id?: string) => Action,
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
      const state: State = this.props.state;
      const channel = state.channels[state.current_channel];

      const lines = [];
      for (const [id, msg] of channel) {
        lines.push(<li key={id}>
          <span className='nick'>오리너구리</span>
          <span className='content'>{msg}</span>
          <span className='control'>
            <i onClick={_ => this.updateMsg(id, '수정')} className='fa fa-pencil'/>
            &nbsp;
            <i onClick={_ => this.deleteMsg(id)} className='fa fa-trash-o'/>
          </span>
        </li>);
      }
      return <ul ref={n=>elem=n}>{lines}</ul>;
    },
    updateMsg(id: string, msg: string) {
      const { current_channel: ch }: State = this.props.state;
      this.props.updateMsg(ch, msg, id);
    },
    deleteMsg(id: string) {
      const { current_channel: ch }: State = this.props.state;
      this.props.updateMsg(ch, '/* 아직 메세지 삭제 기능이 구현 안됨 */', id);
    },
  });
})();

const View = (props: Props) => {
  const { state, updateMsg, createChannel, changeChannel } = props
  let field_channel, field;

  const onSubmit = e => {
    e.preventDefault();
    if (!field.value) { return; }

    updateMsg(state.current_channel, field.value);
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
      <ChannelView {...props}/>
      <form onSubmit={onSubmit}>
        <input className='field' placeholder='친구들과 이야기하세요!' ref={n=>field=n}/>
      </form>
    </div>
  </div>;
};


//
// App
//
type StateProps = { state: State };
type DispatchProps = $Diff<Props, StateProps>;

const mapState = (state: State): StateProps => ({ state });
const mapDispatch = (dispatch: Dispatch): DispatchProps => ({
  updateMsg: (channel, msg, msg_id = UUID.create().toString()) => {
    const action = { type: 'UpdateMsg', channel, msg, msg_id };
    sendAction(action);
    return dispatch(action);
  },
  createChannel: channel => dispatch({ type: 'CreateChannel', channel }),
  changeChannel: channel => dispatch({ type: 'ChangeChannel', channel }),
});
const App = connect(mapState, mapDispatch)(View);

const store = createStore(reducer, compose(
  window.devToolsExtension ? window.devToolsExtension() : f => f
));


//
// Communication
//
const socket = new WebSocket(`ws://${location.host}/api`);

// 주어진 action 객체를 그대로 서버에 JSON으로 전송한다.
function sendAction(action: Action) {
  return socket.send(JSON.stringify(action));
}

socket.onmessage = event => {
  // 서버로부터 전달받은 action 객체를 그대로 dispatch 한다
  store.dispatch(JSON.parse(event.data));
}


//
// Etc
//
store.subscribe(() => {
  // Generate permalink
  location.hash = store.getState().current_channel;
});

render(
  <Provider store={store}>
    <App/>
  </Provider>,
  document.getElementById('target')
);
