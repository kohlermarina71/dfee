import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.loggedIn) {
          navigate("/home", { replace: true });
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
      }
    }
  }, [navigate]);

  const handleGoogleSuccess = (credentialResponse: any) => {
    console.log("Google Sign-In Success:", credentialResponse);

    try {
      // Decode the JWT token to get user info
      const token = credentialResponse.credential;
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );

      const userInfo = JSON.parse(jsonPayload);

      // Store comprehensive login info
      const userData = {
        loggedIn: true,
        googleCredential: credentialResponse.credential,
        userInfo: {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          sub: userInfo.sub,
        },
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("loginSuccess", "true");

      // Navigate to home page
      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Error processing Google Sign-In:", error);
      handleGoogleError();
    }
  };

  const handleGoogleError = () => {
    console.log("Google Sign-In Error");
    alert("فشل في تسجيل الدخول بحساب جوجل. يرجى المحاولة مرة أخرى.");
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div
        className="min-h-screen w-full flex items-center justify-center bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80')",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-bluegray-900/90 to-bluegray-800/90 backdrop-blur-sm"></div>

        {/* Content */}
        <div className="container relative z-10 px-4 py-10 mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="flex flex-col items-center">
                <img
                  src="/yacin-gym-logo.png"
                  alt="Yacin Gym Logo"
                  className="h-24 w-24 rounded-full shadow-lg border-2 border-yellow-300 object-cover"
                />
                <h1 className="text-4xl font-bold text-center mt-4 mb-8 bg-gradient-to-r from-yellow-300 to-yellow-600 bg-clip-text text-transparent">
                  Yacin Gym
                </h1>
              </div>
            </div>

            <Card className="bg-bluegray-800/80 backdrop-blur-xl border-bluegray-700 shadow-xl">
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    تسجيل الدخول
                  </h2>
                  <p className="text-gray-300 text-sm mb-6">
                    سجل دخولك باستخدام حساب جوجل
                  </p>
                </div>

                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_blue"
                    size="large"
                    text="signin_with"
                    locale="ar"
                    useOneTap={false}
                    auto_select={false}
                  />
                </div>

                <div className="text-center text-xs text-gray-400 mt-4">
                  بالضغط على تسجيل الدخول، فإنك توافق على شروط الاستخدام
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Animated Blobs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl"
          animate={{
            x: [0, 10, 0],
            y: [0, 15, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl"
          animate={{
            x: [0, -20, 0],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </div>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;
