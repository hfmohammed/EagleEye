import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_WEBSOCKET_PROTOCOL}://${import.meta.env.VITE_WEBSOCKET_HOST}:${import.meta.env.VITE_WEBSOCKET_PORT}/auth/user`, {
      withCredentials: true
    }).then(async (res) => {
      const user = res.data;
      console.log("OAuth user:", user);

      if (user.email && user.access_token && user.refresh_token) {
        localStorage.setItem("access_token", user.access_token);
        localStorage.setItem("refresh_token", user.refresh_token);
        localStorage.setItem("username", user.email);
        localStorage.setItem("fps", user.fps);
        localStorage.setItem("rtspLinks", JSON.stringify(user.rtspLinks));
        localStorage.setItem("inputSource", user.inputSource);
        localStorage.setItem("enableAnnotationsRef", user.enableAnnotationsRef);

        navigate("/");
      } else {
        navigate("/login");
      }
    });
  }, []);

  return <p>Logging you in...</p>;
};

export default OAuthCallback;
