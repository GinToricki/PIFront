import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Homepage from "./Pages/Homepage.jsx";
import 'bootstrap/dist/css/bootstrap.css';
import { BrowserRouter, Routes, Route } from "react-router";
import Marketplace from "./Pages/Marketplace.jsx";
import Collection from "./Pages/Collection.jsx";
import Login from "./Pages/Login.jsx";
import Register from "./Pages/Register.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
        <Routes >
            <Route path="/" element={<Homepage />} />
            <Route path="/Marketplace" element={<Marketplace />} />
            <Route path="/Collection" element={<Collection />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Register" element={<Register />} />
        </Routes>
    </BrowserRouter>
  </StrictMode>
)
