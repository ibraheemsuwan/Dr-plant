import { useEffect } from "react";
import { useNavigate } from "react-router";
import { UNAUTHORIZED_EVENT } from "../api/http";
import { useUser } from "../contexts/UserContext";

/** Clears session and sends user to login when the API returns 401. */
export function ApiAuthListener() {
  const navigate = useNavigate();
  const { logout } = useUser();

  useEffect(() => {
    const on401 = () => {
      logout();
      navigate("/login", { replace: true });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, on401);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, on401);
  }, [logout, navigate]);

  return null;
}
