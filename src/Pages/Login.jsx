import Navbar from "../Components/Navbar.jsx";
import {useNavigate} from "react-router";
import axiosInstance from "../Common/axiosInstance.jsx";
import useAuthStore from "../store/authStore.js";
import {KeyRound, User, UserPlus} from "lucide-react";
import {Alert, Snackbar} from "@mui/material";
import {useState} from "react";
import "../styles/auth.css";

function Login() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [snackbar, setSnackbar] = useState({
        open: false,
        type: "success",
        message: "",
    });

    function handleCloseSnackbar() {
        setSnackbar((prev) => ({ ...prev, open: false }));
    }

    function normalizeRoles(rawRoles) {
        if (Array.isArray(rawRoles)) {
            return rawRoles.filter(Boolean);
        }

        if (rawRoles) {
            return [rawRoles];
        }

        return [];
    }

    function login(e) {
        e.preventDefault();

        const formData = new FormData(e.target);

        const loginInformation = {
            username: formData.get("username"),
            password: formData.get("password"),
        };

        axiosInstance.post("/Account/Login", loginInformation).then((response) => {
            const payload = response?.data;

            if(payload?.token) {
                const roles = normalizeRoles(payload.roles ?? payload.role);
                const lowerCasedRoles = roles.map((roleValue) => String(roleValue).toLowerCase());
                const isAdmin = lowerCasedRoles.includes("admin");
                const isMember = lowerCasedRoles.includes("member");

                setAuth({
                    token: payload.token,
                    userId: payload.id ?? payload.userId ?? payload.user?.id ?? payload.user?.userId,
                    roles,
                    user: payload.user ?? null,
                    funds: payload.funds ?? payload.balance ?? payload.wallet ?? payload.walletBalance,
                });

                const roleMessage = isAdmin ? "Admin" : isMember ? "Member" : "User";
                setSnackbar({
                    open: true,
                    type: "success",
                    message: `${roleMessage} login successful.`,
                });
                setTimeout(() => navigate("/Marketplace"), 900);
                return;
            }

            setSnackbar({
                open: true,
                type: "error",
                message: "Login failed. Missing token in response.",
            });
        }).catch((error) => {
            console.log(error);
            setSnackbar({
                open: true,
                type: "error",
                message: "Login failed. Please check your credentials.",
            });
        }).finally(() => {

        })
    }

    return (
        <>
            <Navbar />
            <div className="auth-page">
                <div className="auth-shell container">
                    <section className="auth-panel">
                        <div className="auth-header">
                            <p className="auth-kicker">Account</p>
                            <h1>Welcome back</h1>
                            <p className="auth-subtitle">Sign in to access your marketplace account and purchases.</p>
                        </div>

                        <form onSubmit={login} method="POST" className="auth-form">
                            <label className="auth-field" htmlFor="usernameInput">
                                <span>Username</span>
                                <div className="auth-input-wrap">
                                    <User size={16} />
                                    <input type="text" id="usernameInput" name="username" required />
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
                                <button type="submit" className="auth-primary-button">Login</button>
                                <button type="button" className="auth-secondary-button" onClick={() => navigate("/Register")}>
                                    <UserPlus size={16} />
                                    Register
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={2500}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert
                    severity={snackbar.type}
                    onClose={handleCloseSnackbar}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    )
}

export default Login;
