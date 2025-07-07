import React, {useState, useRef, useContext, useEffect} from "react";
import { DataContext } from "../context/DataContext";
import Login from "./login";
import Signup from "./signup.jsx";
import App from "../App.jsx";
import {AuthenticationContext} from "../context/AuthenticationContext.jsx";

const Authentication = () => {
    const {isAuthenticated, setIsAuthenticated} = useContext(AuthenticationContext);

    return isAuthenticated ? <App /> : <Login />;
}

export default Authentication;