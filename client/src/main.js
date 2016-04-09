// @flow
import React from 'react'
import { render } from 'react-dom'
import { createStore, compose } from 'redux'
import { Provider, connect } from 'react-redux'

import 'normalize.css/normalize.css'
import './main.styl'

// States
type State = { lines: Array<string>, buffer: string };
type Action = {
  type: 'TypeMsg'|'SubmitMsg',
  message?: string, // `type === 'TypeMsg'` 일 경우에만 쓰이는 필드
};
type Dispatch = (action: Action) => Action;
const init: State = { lines: ['환영합니다! 친구들과 대화를 시작하세요.'], buffer: '' };

const reducer = (state: State = init, action: Action): State => {
  switch (action.type) {
  case 'TypeMsg':
    if (action.message == null) { return state; } // Validation

    return { lines: state.lines, buffer: action.message };
  case 'SubmitMsg':
    const lines = state.lines.slice();
    lines.push(state.buffer);

    return { lines, buffer: '' };
  default:
    return state;
  }
}

// View
type Props = {
  state: State,
  type: (message: string) => Action,
  submit: () => Action,
};

const View = ({ state, type, submit }: Props) => {
  let field;

  const onChange = e => type(field.value);
  const onSubmit = e => {
    e.preventDefault();
    submit();
  };

  return <div>
    <div>
      { state.lines.map(line => <div>{line}</div>) }
    </div>
    <form onSubmit={onSubmit}>
      <input placeholder='친구들과 이야기하세요!'
        value={state.buffer} onChange={onChange} ref={n=>{field=n}}/>
    </form>
  </div>;
};

// App
type StateProps = { state: State };
type DispatchProps = $Diff<Props, StateProps>;

const mapState = (state: State): StateProps => ({ state });
const mapDispatch = (dispatch: Dispatch): DispatchProps => ({
  type: message => dispatch({ type: 'TypeMsg', message }),
  submit: () => dispatch({ type: 'SubmitMsg' }),
});
const App = connect(mapState, mapDispatch)(View);

const store = createStore(reducer, compose(
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

render(
  <Provider store={store}>
    <App/>
  </Provider>,
  document.getElementById('target')
);
