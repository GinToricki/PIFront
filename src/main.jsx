import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Homepage from "./Pages/Homepage.jsx";
import 'bootstrap/dist/css/bootstrap.css';
import { BrowserRouter, Routes, Route } from "react-router";
import Marketplace from "./Pages/Marketplace.jsx";
import Collection from "./Pages/Collection.jsx";
import Login from "./Pages/Login.jsx";
import Register from "./Pages/Register.jsx";
import ShoppingCart from "./Pages/ShoppingCart.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import Tournaments from "./Pages/Tournaments.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
        <Routes >
            <Route path="/" element={<Homepage />} />
            <Route path="/Marketplace" element={<Marketplace />} />
            <Route path="/Collection" element={<Collection />} />
            <Route path="/ShoppingCart" element={<ShoppingCart />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Register" element={<Register />} />
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/Tournaments" element={<Tournaments />} />
        </Routes>
    </BrowserRouter>
  </StrictMode>
)
