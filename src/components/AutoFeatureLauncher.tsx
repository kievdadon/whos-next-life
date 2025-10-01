import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Automatically opens Driver/Business features for approved users when landing on home/auth
const AutoFeatureLauncher = () => {
  const { hasApprovedBusiness, hasApprovedDriver } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Only auto-open from home or auth pages to avoid interrupting deep routes
    const onEntryPaths = ["/", "/auth"]; 
    if (!onEntryPaths.includes(location.pathname)) return;

    // Prefer Business over Driver if both are approved
    if (hasApprovedBusiness) {
      navigate("/business-dashboard");
      return;
    }
    if (hasApprovedDriver) {
      navigate("/driver-dashboard");
      return;
    }
  }, [hasApprovedBusiness, hasApprovedDriver, location.pathname, navigate]);

  return null;
};

export default AutoFeatureLauncher;
