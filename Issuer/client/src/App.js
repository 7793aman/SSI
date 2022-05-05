import './App.css';
import Login from '../src/Login/LoginComponent';
import Home from '../src/HomeComponent';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";

export default function App() {
  return (

    <div className="App">
      <Router>
        <Routes>
          <Route path='/' element={<Login />} />
          <Route path='/home' element={<Home />} />
        </Routes>
      </Router>
    </div>

  );
}

