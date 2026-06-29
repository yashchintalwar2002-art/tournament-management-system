import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function SocialLoginSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const email = searchParams.get("email");
    const role = searchParams.get("role") || "PLAYER";

    sessionStorage.setItem("email", email);
    sessionStorage.setItem("role", role);
    sessionStorage.setItem("token", "GOOGLE_LOGIN");

    if (role === "ADMIN") {
      navigate("/admin");
    } else if (role === "ORGANIZER") {
      navigate("/organizer");
    } else {
      navigate("/player");
    }
  }, [navigate, searchParams]);

  return <h2>Login successful... Redirecting</h2>;
}

export default SocialLoginSuccess;