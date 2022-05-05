import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from '../api';
import "../Login/LoginComponent.css"

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    async function handleSubmit(e) {
        e.preventDefault();
        const response = await api.post(`/login`);
        console.log(response.data);
        const data = response.data;
        console.log(response);
        if (data.length === 0) {
            console.log("invalid password or username");
        } else {
            navigate("/home");
        }
    }

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    return (
        <div className="form-container flex-row align-center justify-center">
            <form onSubmit={e => handleSubmit(e)}>
                <div className="form flex-column">
                    <h3>Sign in</h3>
                    <div className="flex-column form-controls">
                        <input className="username" type='text' placeholder='Username' value={formData.username} name='username' onChange={e => handleChange(e)} ></input>
                        <input className="password" type='password' placeholder='Password' value={formData.password} name='password' onChange={e => handleChange(e)} ></input>
                        <button className='button' type='submit'>Login</button>
                    </div>
                </div>
            </form>

        </div>
    )
}

export default Login;