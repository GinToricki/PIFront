import Navbar from "../Components/Navbar.jsx";

function Collection() {
    return(
        <>
            <Navbar active={"collection"}></Navbar>
            <div className="container">
                <h2>Card Collection</h2>
            </div>
        </>
    )
}

export default Collection;