import Navbar from "../Components/Navbar.jsx";
import {useNavigate} from "react-router";
import axiosInstance from "../Common/axiosInstance";
import {useState} from "react";
import {Alert, Snackbar} from "@mui/material";
import { Cog } from "lucide-react";

function Register() {
    const navigate = useNavigate();
    const [busy,setBusy] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        type:"success",
        message: "",
    })

    function handleClose() {
        setSnackbar((prev) => ({...prev, open: false}))
    }

    function register(e) {
        e.preventDefault();
        setBusy(true);
        const formData = new FormData(e.target);

        const registerInformation = {
            email: formData.get("email"),
            password: formData.get("password"),
            username: formData.get("username")
        }

        axiosInstance.post("/account/Register", registerInformation, {
            timeout: 5000,
        })
            .then((response) => {
                console.log(response);
                setSnackbar({
                    open: true,
                    type: "success",
                    message: "Registration successful!",
                });
            }).catch((error) => {
                console.log(error);
                setSnackbar({
                    open: true,
                    type: "error",
                    message: "Registration failed. Please try again.",
            })
        }).finally(() => {
            setBusy(false);
        });
    }

    return (
        <>
            <Navbar />
            <div className="container">
                <form onSubmit={register} method="POST">
                    <div className="mb-3">
                        <label htmlFor="usernameInput" className="form-label">Username</label>
                        <input type="username" id="usernameInput" className="form-control" name="username"></input>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="emailInput" className="form-label">Email</label>
                        <input type="email" id="emailInput" className="form-control" name="email"></input>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="passwordInput" className="form-label">Password</label>
                        <input type="password" id="passwordInput" className="form-control" name="password"></input>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={busy}>Register {busy && <Cog className="spin" />}</button>
                    <button type="button" className="btn btn-primary" onClick={() => navigate("/Login")} disabled={busy}>Login {busy && <Cog className="spin" />}</button>
                </form>
            </div>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleClose}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert
                    severity={snackbar.type}
                    onClose={handleClose}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    )
}

export default Register;