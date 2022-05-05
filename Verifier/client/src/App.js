
import './App.css';
import api from './api';
import { useState, useEffect, useRef } from "react";
import axios from 'axios'
function App() {

  const [qrcode, setqrcode] = useState();
  const [verifiedage, setverifiedage] = useState("");
  const [id, setid] = useState();
  async function getQRCode() {
    const resp = await api.get("/qrcode");
    setqrcode(resp.data)
    startFetchAge();
  }

  async function fetchAge() {
    const response = await axios.get("http://localhost:2000/getage");
    if (response.data.age !== "") {
      setverifiedage(response.data.age);
      stopFetchAge();
    }
  }

  function startFetchAge() {
    let intervalID = setInterval(fetchAge, 3000)
    setid(intervalID);
  }

  function stopFetchAge() {
    clearInterval(id);
  }


  useEffect(() => {
    getQRCode();
  }, []);

  return (
    <div className="App d-flex justify-content-center align-items-center" style={{ height: "100vh", width: "auto" }}>
      <div className="card d-flex align-items-center" style={{ height: "auto", width: "auto" }}>
        <a className="m-3" dangerouslySetInnerHTML={{ __html: qrcode }} style={{ width: "200px", height: "200px" }}
          href="#" rel="tooltip" title="Click to open deeplink on mobile device"></a>
        <div className="card-body">
          <h5 className="card-title">Alochol Shop</h5>
          <p className="card-text">Please scan the bar code to verify your age</p>
          {verifiedage == "" ? <div>
            <div className="spinner-grow text-success mr-3" role="status">
              <span className="sr-only"></span>
            </div>
            <div className="spinner-grow text-danger mr-3" role="status">
              <span className="sr-only"></span>
            </div>
            <div className="spinner-grow text-warning" role="status">
              <span className="sr-only"></span>
            </div>
          </div> : ""}
          <p>{verifiedage}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
