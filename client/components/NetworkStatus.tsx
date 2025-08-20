import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [serverReachable, setServerReachable] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkServerConnection = async () => {
    setIsChecking(true);
    try {
      const response = await fetch("/api/ping", {
        method: "GET",
        cache: "no-cache",
      });
      setServerReachable(response.ok);
    } catch (error) {
      setServerReachable(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkServerConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setServerReachable(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check server connection on mount
    checkServerConnection();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && serverReachable) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <WifiOff className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          {!isOnline
            ? "No internet connection. Please check your network."
            : "Server connection lost. Some features may not work."}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={checkServerConnection}
          disabled={isChecking}
          className="ml-2"
        >
          {isChecking ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Wifi className="h-3 w-3" />
          )}
          {isChecking ? "Checking..." : "Retry"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export default NetworkStatus;
