import React, { useState, useContext, useEffect } from 'react';
import {AuthenticationContext} from "../context/AuthenticationContext.jsx";

const Signup = () => {
  const [isAuthenticated, setIsAuthenticated] = useContext(AuthenticationContext);

  return (
    <div>
      Signup
    </div>
  );
}

export default Signup;