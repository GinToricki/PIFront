import Navbar from "../Components/Navbar.jsx";
import {useNavigate} from "react-router";
import axiosInstance from "../Common/axiosInstance";
import {useState} from "react";
import {Alert, Snackbar} from "@mui/material";
import {Cog, KeyRound, LogIn, Mail, User} from "lucide-react";
import "../styles/auth.css";

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
            <div className="auth-page">
                <div className="auth-shell container">
                    <section className="auth-panel">
                        <div className="auth-header">
                            <p className="auth-kicker">Account</p>
                            <h1>Create account</h1>
                            <p className="auth-subtitle">Register to start listing cards and managing your collection.</p>
                        </div>

                        <form onSubmit={register} method="POST" className="auth-form">
                            <label className="auth-field" htmlFor="usernameInput">
                                <span>Username</span>
                                <div className="auth-input-wrap">
                                    <User size={16} />
                                    <input type="text" id="usernameInput" name="username" required />
                                </div>
                            </label>
                            <label className="auth-field" htmlFor="emailInput">
                                <span>Email</span>
                                <div className="auth-input-wrap">
                                    <Mail size={16} />
                                    <input type="email" id="emailInput" name="email" required />
                                </div>
                            </label>
                            <label className="auth-field" htmlFor="passwordInput">
                                <span>Password</span>
                                <div className="auth-input-wrap">
                                    <KeyRound size={16} />
                                    <input type="password" id="passwordInput" name="password" required />
                                </div>
                            </label>

                            <div className="auth-actions">
                                <button type="submit" className="auth-primary-button" disabled={busy}>
                                    Register {busy && <Cog className="spin" />}
                                </button>
                                <button type="button" className="auth-secondary-button" onClick={() => navigate("/Login")} disabled={busy}>
                                    <LogIn size={16} />
                                    Login
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
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
