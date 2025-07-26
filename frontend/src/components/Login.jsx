import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../assets/LogoNgeza.png"; // Assuming this path is correct
import { Mail, Lock, LogIn, Loader2, Info } from "lucide-react"; // Import Lucide icons

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for loading indicator
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true); // Start loading

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Email ou mot de passe incorrect. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false); // End loading
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-teal-50 to-blue-100 font-inter">
      
      {/* Left side: Welcome Message and Logo */}
      <div className="flex flex-col justify-center items-center text-center p-8 md:w-1/2 bg-gradient-to-b from-teal-500 to-teal-600 text-white shadow-2xl md:rounded-r-3xl">
        <img src={Logo} width="250px" alt="Ngeza Logo" className="mb-6 animate-fade-in-down" /> 
        <h1 className="text-4xl font-extrabold mb-4 animate-fade-in-up">Bienvenue chez Vet-ika !</h1>
        <p className="text-lg max-w-md leading-relaxed animate-fade-in-up delay-100">
          Retrouvez les meilleurs soins vétérinaires pour vos animaux préférés.  
          Planifiez vos rendez-vous, trouvez des conseils santé,  
          et offrez-leur le bonheur qu'ils méritent ! 🐾
        </p>
      </div>

      {/* Right side: Login Form inside a Card */}
      <div className="flex flex-col justify-center items-center p-8 md:w-1/2">
        <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 animate-scale-in">
          <h2 className="text-4xl font-extrabold text-teal-700 mb-8 text-center">Connexion</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 animate-fade-in-down" role="alert">
              <div className="flex items-center">
                <Info className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="block sm:inline font-medium">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="sr-only">Adresse email</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  placeholder="Adresse email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  aria-label="Adresse email"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Mot de passe</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  id="password"
                  placeholder="Mot de passe"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-label="Mot de passe"
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-lg font-semibold text-lg transition duration-300 transform shadow-md hover:shadow-lg hover:scale-105
                ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              disabled={isSubmitting}
              aria-label="Se connecter"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {isSubmitting ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <p className="mt-8 text-center text-base text-gray-600">
            Vous n'avez pas encore de compte ?{" "}
            <Link to="/inscription" className="text-blue-600 hover:underline font-bold transition duration-200">
              Inscrivez-vous
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};

export default Login;
