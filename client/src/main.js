// @flow
import React from 'react'
import { render } from 'react-dom'
import { createStore, compose, applyMiddleware } from 'redux'
import { Provider, connect } from 'react-redux'

import 'normalize.css/normalize.css'
import './main.styl'

// States
type State = { lines: Array<string> };
type Action = { type: 'SubmitMsg'|'ReceiveMsg', message?: string };
type Dispatch = (action: Action) => Action;
const init: State = { lines: ['환영합니다! 친구들과 대화를 시작하세요.'] };

const reducer = (state: State = init, action: Action): State => {
  switch (action.type) {
  case 'SubmitMsg':
    return state;
  case 'ReceiveMsg':
    // Validate action
    const msg = action.message;
    if (msg == null) { return state; }

    const lines = state.lines.slice();
    lines.push(msg);

    return { lines };
  default:
    return state;
  }
}

// Communication (1)
const socket = new WebSocket(`ws://${location.host}/api`);
const server = store => next => action => {
  if (action.type === 'SubmitMsg') {
    socket.send(action.message);
  }
  return next(action);
};

// View
type Props = {
  state: State,
  submit: (message: string) => Action,
};

const View = ({ state, submit }: Props) => {
  let field;
  const onSubmit = e => {
    e.preventDefault();
    submit(field.value);
    field.value = '';
  };

  return <div>
    <div>
      { state.lines.map(line => <div>{line}</div>) }
    </div>
    <form onSubmit={onSubmit}>
      <input placeholder='친구들과 이야기하세요!' ref={n=>{field=n}}/>
    </form>
  </div>;
};

// App
type StateProps = { state: State };
type DispatchProps = $Diff<Props, StateProps>;

const mapState = (state: State): StateProps => ({ state });
const mapDispatch = (dispatch: Dispatch): DispatchProps => ({
  submit: message => dispatch({ type: 'SubmitMsg', message }),
});
const App = connect(mapState, mapDispatch)(View);

const store = createStore(reducer, compose(
  applyMiddleware(server),
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

// Communication (2)
socket.onmessage = event => {
  store.dispatch({ type: 'ReceiveMsg', message: event.data });
}


// Entry Point
render(
  <Provider store={store}>
    <App/>
  </Provider>,
  document.getElementById('target')
);
