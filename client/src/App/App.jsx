import React from "react";
import { Router, Route, Switch } from "react-router-dom";
import { connect, Provider  } from "react-redux";

import { history } from "../_helpers";
import { alertActions } from "../_actions";
import { PrivateRoute } from "../_components";
import { HomePage } from "../HomePage";
import { LoginPage } from "../LoginPage";
import { NotFoundPage } from "../NotFoundPage";
import { HelloLib } from "hellolibalemarcha";
import { ByeLib } from "hellolibalemarcha";

class App extends React.Component {
  constructor(props) {
    super(props);

    const { dispatch } = this.props;
    history.listen((location, action) => {
      // clear alert on location change
      dispatch(alertActions.clear());
    });
  }

  componentDidMount() {}

  render() {
    const { alert } = this.props;
    return (
      <div className="container-fluid">
        <HelloLib history={history}/>
        <div className="row justify-content-md-center">
          <div className="col-8">
              {alert.message && (
                <div className={`alert ${alert.type}`}>{alert.message}</div>
              )}
              <Router history={history}>
                <div>
                  <Switch>
                    <PrivateRoute exact path="/" component={HomePage} />
                    <Route path="/login" component={LoginPage} />
                    <Route path="/hello" component={HelloLib} />
                    <Route path="/bye" component={ByeLib} />
                    <Route component={NotFoundPage} />
                  </Switch>
                </div>
              </Router>
          </div>
        </div>
        <ByeLib />
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { alert } = state;
  return {
    alert
  };
}

const connectedApp = connect(mapStateToProps)(App);
export { connectedApp as App };
