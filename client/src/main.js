import React from 'react'
import { render } from 'react-dom'
import { createStore, compose, applyMiddleware } from 'redux'
import { Provider, connect } from 'react-redux'
import UUID from 'uuid-js'
import ReconnectingWebSocket from 'reconnectingwebsocket'
import { Base64 } from 'js-base64'

import nickfile from './nicks.txt'

import 'normalize.css/normalize.css'
import 'font-awesome/css/font-awesome.css'
import './main.styl'

// Use random nickname
// TODO: 바꿀 수 있도록 하기
const mynick: string = (_ => {
  const nicks = nickfile.split('\n').filter(n => n);
  return nicks[Math.floor(Math.random()*nicks.length)];
})();

const myid: string = UUID.create().toString();


//
// Permalink
//
function getBase64Hash(): string { return Base64.decode(location.hash.slice(1)); }
function setBase64Hash(name: string) { location.hash = Base64.encodeURI(name); }


//
// States
//
type Message = {
  userid: string,
  usernick: string,
  txt: string,
};
type Channel = Map<string, Message>;
const new_channel = (): Channel => new Map;

type State = {
  channels: { [name: string]: Channel },
  current_channel: string,
  editing: ?string,
};
const init: State = (_ => {
  // Accept permalink
  const channels: Object = ['general', 'random', 'notice']
  .map(k => ({[k]: new_channel()}))
  .reduce((l, r) => Object.assign(l, r));

  let init = getBase64Hash();
  if (!init) { setBase64Hash(init = 'general'); } // Default channel
  if (!(init in channels)) { channels[init] = new_channel(); }

  return { channels, current_channel: init, editing: null };
})();

type Action = {
  type: 'CreateMsg'|'UpdateMsg'|'DeleteMsg'|'StartEdit'|'StopEdit'|'CreateChannel'|'ChangeChannel',

  channel?: string, // Used with: UpdateMsg | DeleteMsg | CreateChannel | ChangeChannel
  msg?: Message,    // Used with: CreateMsg
  msg_id?: string,  // Used with: CreateMsg | UpdateMsg | DeleteMsg | StartEdit
  msg_txt?: string  // Used with: UpdateMsg
};
type Dispatch = (action: Action) => Action;

const reducer = (state: State = init, action: Action): State => {
  const { channel: ch, msg, msg_id, msg_txt } = action;
  switch (action.type) {
    case 'CreateMsg': {
      // Validation
      if (ch == null || msg_id == null || msg == null) { return state; }

      const next = Object.assign({}, state);

      // 내가 모르는 채널에서 메세지가 올 경우, 그 채널을 추가
      if (!(ch in next.channels)) { next.channels[ch] = new_channel(); }

      next.channels[ch].set(msg_id, msg);
      return next;
    }
    case 'UpdateMsg': {
      // Validation
      if (ch == null || msg_id == null || msg_txt == null) { return state; }

      // 내가 모르는 채널의 메세지 수정일경우, 무시
      if (!(ch in state.channels)) { return state; }
      // 내가 받은적 없는 메세지의 수정일경우, 무시
      if (state.channels[ch].get(msg_id) == null) { return state; }

      const next = Object.assign({}, state);
      // $FlowIssue: The result of `.get(msg_id)` cannot be `undefined`
      next.channels[ch].get(msg_id).txt = msg_txt;
      return next;
    }
    case 'DeleteMsg': {
      // Validation
      if (ch == null || msg_id == null) { return state; }

      // 내가 모르는 채널의 메세지 삭제일경우, 무시
      if (!(ch in state.channels)) { return state; }

      const next = Object.assign({}, state);
      next.channels[ch].delete(msg_id);
      return next;
    }
    case 'StartEdit': {
      // Validation
      if (msg_id == null) { return state; }

      const { channels, current_channel } = state;
      return { channels, current_channel, editing: msg_id };
    }
    case 'StopEdit': {
      const { channels, current_channel } = state;
      return { channels, current_channel, editing: null };
    }
    case 'CreateChannel': {
      // Validation
      if (ch == null || ch in state.channels) { return state; }

      const next = Object.assign({}, state);
      next.channels[ch] = new_channel();
      return next;
    }
    case 'ChangeChannel': {
      // Validation
      if (ch == null) { return state; }

      const { channels } = state;
      return { channels, current_channel: ch, editing: null };
    }
    default: return state;
  }
}


//
// View
//
type Props = {
  state: State,
  createMsg: (channel: string, msg_txt: string) => Action,
  updateMsg: (channel: string, msg_txt: string, msg_id: string) => Action,
  deleteMsg: (channel: string, msg_id: string) => Action,
  startEdit: (msg_id: string) => Action,
  stopEdit: () => Action,
  createChannel: (channel: string) => Action,
  changeChannel: (channel: string) => Action,
};

const ChannelView = (() => {
  let elem, editingElm;
  return React.createClass({
    componentDidUpdate(params) {
      // TODO: 남이 메세지를 보냈을때도 스크롤이 확확 올라가버리면 곤란함
      elem.scrollTop = elem.scrollHeight - elem.clientHeight;

      if (editingElm != null) { editingElm.focus(); }
    },
    onSubmit(e) {
      e.preventDefault();
      if (editingElm != null) { editingElm.blur() }
    },
    render() {
      const p: Props = this.props;
      const { current_channel: ch, editing } = p.state;
      const channel = p.state.channels[ch];

      const lines = [];
      for (const [id, { userid, usernick, txt }] of channel) {
        const is_editable: bool = userid.localeCompare(myid) === 0;
        const is_editing: bool = editing == null || id.localeCompare(editing) !== 0;

        lines.push(<li key={id}>
          <span className='nick'>{usernick}</span>
          {(_=> is_editing?
            <div className='content'>{txt}</div> :
            <form className='content' onSubmit={this.onSubmit}>
              <input value={txt}
                ref={n =>editingElm=n}
                onBlur={p.stopEdit}
                onChange={_ => p.updateMsg(ch, editingElm.value, id)}/>
            </form>
          )()}
          {(_=> !is_editable? null :
            <span className='control'>
              <i onClick={_ => p.startEdit(id)} className='fa fa-pencil'/>
              &nbsp;
              <i onClick={_ => p.deleteMsg(ch, id)} className='fa fa-trash-o'/>
            </span>
          )()}
        </li>);
      }
      return <ul ref={n=>elem=n}>{lines}</ul>;
    },
  });
})();

const View = (props: Props) => {
  const { state, createMsg, createChannel, changeChannel } = props
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
      <ChannelView {...props}/>
      <form onSubmit={onSubmit}>
        <span>{mynick}</span>
        <input className='field' placeholder='다른 동물 친구들과 이야기하세요!' ref={n=>field=n}/>
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
  createMsg: (channel, txt) => {
    const msg_id = UUID.create().toString();
    const msg = { userid: myid, usernick: mynick, txt }
    const action = { type: 'CreateMsg', channel, msg, msg_id };
    sendAction(action);
    return dispatch(action);
  },
  updateMsg: (channel, msg_txt, msg_id) => {
    const action = { type: 'UpdateMsg', channel, msg_txt, msg_id };
    sendAction(action);
    return dispatch(action);
  },
  deleteMsg: (channel, msg_id) => {
    const action = { type: 'DeleteMsg', channel, msg_id };
    sendAction(action);
    return dispatch(action);
  },
  startEdit: (msg_id) => dispatch({ type: 'StartEdit', msg_id }),
  stopEdit: () => dispatch({ type: 'StopEdit' }),
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
const socket = (_ => {
  const host = location.host;
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return new ReconnectingWebSocket(`${protocol}//${host}/api`);
})();

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
  setBase64Hash(store.getState().current_channel);
});

render(
  <Provider store={store}>
    <App/>
  </Provider>,
  document.getElementById('target')
);
