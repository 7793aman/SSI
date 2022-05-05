import api from './api';
import { useState } from "react";
import Modal from 'react-bootstrap/Modal';
function Home() {
    const [qrcode, setqrcode] = useState();
    const [subjectDid, setsubjectDid] = useState();
    const [deeplink, setdeeplink] = useState();
    const [jwe, setjwe] = useState();

    const [verificationshow, setverificationshow] = useState(false);
    const handleVerificationClose = () => setverificationshow(false);
    const handleVeriicationOpen = () => setverificationshow(true);

    const [credentialshow, setcredentialshow] = useState(false);
    const handleCredentialClose = () => setcredentialshow(false);
    const handleCredentialOpen = () => setcredentialshow(true);


    const [credentialqrcode, setcredentialqrcode] = useState();
    const [credentialdeeplink, setcredentialdeeplink] = useState();

    const [checkwallet, setcheckwallet] = useState(false);

    const [showspinner, setshowspinner] = useState(false);
    const [spin, setspin] = useState(false);

    //Step-1
    async function verifyYourself() {
        setshowspinner(true);
        const resp = await api.post("/presentations/request",
            {})
        console.log("verification response", resp);
        setqrcode(resp.data.qrcode);
        setdeeplink(resp.data.deeplink)
        handleVeriicationOpen();
        setshowspinner(false);
        console.log("Received DIDAuth presentation request")
        pollAuthenticationWalletResponse(resp.data.uid)
    }

    //Step-2
    async function pollAuthenticationWalletResponse(uid) {
        setTimeout(function () {
            fetch(`http://localhost:3000/presentations/${uid}/response`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }).then(async (resp) => {
                const { data } = await resp.json()
                if (data) {
                    console.log("Received DIDAuth response", data)
                    setsubjectDid(data.subjectDid)
                    handleVerificationClose();
                    return;
                }
                pollAuthenticationWalletResponse(uid)
            })
        }, 500)
    }

    //Step-3
    async function generateCredentials() {
        setspin(true);
        const resp = await api.post("/credentials/issue", { subjectDid });
        setcredentialqrcode(resp.data.qrcode);
        setcredentialdeeplink(resp.data.deeplink);
        setjwe(resp.data.jwe);
        handleCredentialOpen();
        setspin(false);
    }

    //Step-4
    async function sendCredentials() {
        const data = {
            subjectDid, message: jwe
        }
        const resp = await api.post("/messaging/send", data);
        setcheckwallet(true);
        window.alert("Message sent. Please check your mobile wallet!");
    }


    return (

        <div className="flex-column pt-0 pb-0 pl-2 pr-2">
            <header className="d-flex flex-wrap justify-content-start py-3 mb-4 mr-2 border-bottom">
                <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-dark text-decoration-none">
                    <span className="fs-1">Welcome to your University Portal</span>
                </a>


            </header>

            <div className="row align-items-md-stretch d-flex justify-content-around">
                {/* Verify Identity */}
                <div className="col-md-5 position-relative">
                    <Modal show={verificationshow} onHide={handleVerificationClose}>
                        <Modal.Header closeButton>
                            <Modal.Title>Scan QR code to verify yourself</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>  <a className="m-3" dangerouslySetInnerHTML={{ __html: qrcode }} style={{ width: "150px", height: "150px" }}
                            href={deeplink} rel="tooltip" title="Click to open deeplink on mobile device">

                        </a></Modal.Body>
                    </Modal>
                    <div className="h-100 p-5 text-white bg-dark rounded-3">
                        <h2>Verify yourself for generating SSI credentials</h2>
                        <p>Generate QR code and scan it to verify yourself.A notification will be sent to your university wallet</p>
                        <p>Once you scan QR code, approve the request to verify yourself</p>
                        <button className="btn btn-outline-light" type="button" onClick={verifyYourself}>Verify</button>
                        {subjectDid ? <p className="mt-3 text-success h6">You are verified! Please generate your credentials.</p> : <p></p>}
                        {showspinner ? <div>
                            <div class="spinner-grow text-success m-1" role="status">
                                <span class="sr-only"></span>
                            </div>
                            <div class="spinner-grow text-danger m-1" role="status">
                                <span class="sr-only"></span>
                            </div>
                            <div class="spinner-grow text-warning m-1" role="status">
                                <span class="sr-only"></span>
                            </div>
                        </div> : ""}

                    </div>
                </div>


                {/* Generate Credential */}
                <div className="col-md-5">
                    <Modal show={credentialshow} onHide={handleCredentialClose}>
                        <Modal.Header closeButton>
                            <Modal.Title>Scan QR code to get your crdentials</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>  <a className="m-3" dangerouslySetInnerHTML={{ __html: credentialqrcode }} style={{ width: "150px", height: "150px" }}
                            href={credentialdeeplink} rel="tooltip" title="Click to open deeplink on mobile device">
                        </a></Modal.Body>
                    </Modal>
                    <div className="h-100 p-5 bg-light border rounded-3">
                        <h2>Generate your SSI credentials</h2>
                        <p>Once you verify yourself, please click below to generate your credentials</p>
                        <p>After credentials are generated you will have option to send credentials to your wallet or scan them</p>
                        <button className="btn btn-outline-dark mb-3" disabled={!subjectDid} type="button" onClick={generateCredentials}>Generate Credentials</button>
                        {spin ? <div>
                            <div class="spinner-grow text-success m-1" role="status">
                                <span class="sr-only"></span>
                            </div>
                            <div class="spinner-grow text-danger m-1" role="status">
                                <span class="sr-only"></span>
                            </div>
                            <div class="spinner-grow text-warning m-1" role="status">
                                <span class="sr-only"></span>
                            </div>
                        </div> : ""}
                        {
                            jwe ? <div className="mt-3"> <button className="btn btn-outline-dark" type="button" onClick={sendCredentials}>Send Credentials</button></div> : ""
                        }
                        {
                            checkwallet ? <p className='text-success mt-3 h6'>Your credentials has been generated.Please scan QR code to store them!</p> : ""
                        }
                    </div>
                </div>
            </div>

        </div >
    )
}

export default Home;