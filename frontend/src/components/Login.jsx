import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../assets/LogoNgeza.png";
import { Mail, Lock, LogIn, Loader2, Info, Eye, EyeOff, PawPrint } from "lucide-react";
import BackgroundImage from "../assets/dog.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Email ou mot de passe incorrect. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative flex flex-col md:flex-row h-screen min-h-[600px] font-inter overflow-hidden bg-gray-50">
      {/* Animated background with particles */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={BackgroundImage}
          alt="Veterinary background"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/80 to-blue-900/80 backdrop-blur-[2px]">
          {/* Floating particles */}
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/10"
              style={{
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Left side: Branding section */}
      <div className="relative z-10 flex flex-col justify-center items-center text-center p-8 md:w-1/2 text-white">
        <div className="max-w-md w-full backdrop-blur-sm bg-white/5 p-10 w-full rounded-2xl border border-white/10 shadow-2xl transform transition-all duration-700 hover:shadow-2xl hover:scale-[1.02]">
          <div className="animate-fade-in-down mb-10">
            <img
              src={Logo}
              width="250px"
              alt="Ngeza Logo"
              className="mx-auto mb-8 transform transition-transform duration-500 hover:scale-105"
            />
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-blue-300">
              Bienvenue chez Vet-ika
            </h1>
            <p className="text-lg opacity-90 leading-relaxed">
              L'excellence vétérinaire au service de vos compagnons. Accédez à votre espace personnel pour gérer les rendez-vous et suivre la santé de vos animaux.
            </p>
          </div>

          <div className="animate-fade-in-up delay-300 flex justify-center space-x-4">
            <PawPrint className="w-6 h-6 text-teal-300 animate-bounce" />
            <PawPrint className="w-6 h-6 text-blue-300 animate-bounce delay-100" />
            <PawPrint className="w-6 h-6 text-white animate-bounce delay-200" />
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="relative z-10 flex flex-col justify-center items-center p-8 md:w-1/2">
        <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 transform transition-all duration-500 hover:shadow-2xl hover:scale-[1.01]">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-2 animate-fade-in">
              Connectez-vous
            </h2>
            <p className="text-gray-500 animate-fade-in delay-100">
              Accédez à votre compte pour continuer
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 animate-fade-in-down flex items-start">
              <Info className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="animate-fade-in-up delay-100">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors duration-300" />
                </div>
                <input
                  type="email"
                  id="email"
                  placeholder="votre@email.com"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="animate-fade-in-up delay-200">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors duration-300" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-teal-600 transition-colors duration-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="mt-1 text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-teal-600 hover:text-teal-800 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <div className="animate-fade-in-up delay-300 pt-2">
              <button
                type="submit"
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-300 ${
                  isSubmitting ? "opacity-80" : ""
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Se connecter
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="animate-fade-in-up delay-500 mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Nouveau chez Vet-ika ?{" "}
              <Link
                to="/inscription"
                className="font-medium text-teal-600 hover:text-teal-800 hover:underline"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
          100% {
            transform: translateY(0) rotate(360deg);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.6s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInDown {
          from { 
            opacity: 0;
            transform: translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Login;