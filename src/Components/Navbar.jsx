import '../styles/navbar.css'
import {useNavigate} from "react-router";

function Navbar(props) {
    const navigate = useNavigate();

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
                    </ul>
                    <button className="btn-login" onClick={() => navigate("/Login")}>Login</button>
                </div>
            </div>
        </nav>
    )
}

export default Navbar;