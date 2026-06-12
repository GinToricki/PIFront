import Navbar from "../Components/Navbar.jsx";
import {useNavigate} from "react-router";
import axiosInstance from "../Common/axiosInstance.jsx";
import useAuthStore from "../store/authStore.js";

function Login() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    function login(e) {
        e.preventDefault();

        const formData = new FormData(e.target);

        const loginInformation = {
            username: formData.get("username"),
            password: formData.get("password"),
        };

        axiosInstance.post("/Account/Login", loginInformation).then((response) => {
            if(response.data) {
                setAuth({token: response.data.token, role: response.data.roles});
            }
        }).catch((error) => {
            console.log(error);
        }).finally(() => {

        })
    }

    return (
        <>
            <Navbar />
            <div className="container">
                <form onSubmit={login} method="POST">
                    <div className="mb-3">
                        <label htmlFor="usernameInput" className="form-label">Username</label>
                        <input type="text" id="usernameInput" className="form-control" name="username"></input>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="passwordInput" className="form-label">Password</label>
                        <input type="password" id="passwordInput" className="form-control" name="password"></input>
                    </div>
                    <button type="submit" className="btn btn-primary">Login</button>
                    <button type="button" className="btn btn-primary" onClick={() => navigate("/Register")}>Register</button>
                </form>
            </div>
        </>
    )
}

export default Login;