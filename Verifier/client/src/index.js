import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.render(
  <React.StrictMode>
    <App style={{ height: "100vh" }} />
  </React.StrictMode>,
  document.getElementById('root')
);

