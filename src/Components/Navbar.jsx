import '../styles/navbar.css'
import {useNavigate} from "react-router";
import {ShoppingCart} from "lucide-react";
import useCartStore from "../store/cartStore.js";
import useAuthStore from "../store/authStore.js";

function Navbar(props) {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const logout = useAuthStore((state) => state.logout);
    const totalCartItems = useCartStore((state) =>
        state.items.reduce((total, item) => total + Number(item.quantity || 0), 0)
    );

    return(
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container-fluid">
                <a className="navbar-brand title" href="/">TCG Marketplace</a>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <a className={`nav-link  ${props.active === "marketplace" ? "active ac " : ""} `} href="/Marketplace">Marketplace</a>
                        </li>
                        <li className="nav-item">
                            <a className={`nav-link  ${props.active === "collection" ? "active ac " : ""} `} href="/Collection">Collection</a>
                        </li>
                        <li className="nav-item">
                            <a className={`nav-link  ${props.active === "cart" ? "active ac " : ""} `} href="/ShoppingCart">Shopping Cart</a>
                        </li>
                        <li className="nav-item">
                            <a className={`nav-link  ${props.active === "tournaments" ? "active ac " : ""} `} href="/Tournaments">Tournaments</a>
                        </li>

                    </ul>
                    <div className="navbar-actions">
                        {token && <button className="btn-login" onClick={() => navigate("/Dashboard")}>Dashboard</button>}
                        <button
                            className="cart-icon-button"
                            type="button"
                            aria-label="Open shopping cart"
                            onClick={() => navigate("/ShoppingCart")}
                        >
                            <ShoppingCart size={18} />
                            {totalCartItems > 0 && <span className="cart-count-badge">{totalCartItems}</span>}
                        </button>
                        {!token && <button className="btn-login" onClick={() => navigate("/Login")}>Login</button>}
                        {token && (
                            <button
                                className="btn-login"
                                onClick={() => {
                                    logout();
                                    navigate("/");
                                }}
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar;
