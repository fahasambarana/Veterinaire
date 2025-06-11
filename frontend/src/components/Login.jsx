import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../assets/Logo3.png"

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Email ou mot de passe incorrect.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-blue-100 to-white">
      
      {/* Left side: Welcome Message */}
      <div className="flex flex-col justify-center items-center text-center p-8 md:w-1/2">
        <img src={Logo} width="100px" alt="" /> 
        <p className="text-gray-700 text-lg max-w-md">
          Retrouvez les meilleurs soins vétérinaires pour vos animaux préférés.  
          Planifiez vos rendez-vous, trouvez des conseils santé,  
          et offrez-leur le bonheur qu'ils méritent ! 🐾
        </p>
      </div>

      {/* Right side: Login Form inside a Card */}
      <div className="flex flex-col justify-center items-center p-8 md:w-1/2">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Connexion</h2>

          {error && (
            <p className="text-red-600 text-center mb-4">{error}</p>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Adresse email"
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Mot de passe"
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white p-3 rounded font-semibold transition duration-200"
            >
              Se connecter
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Vous n'avez pas encore de compte ?{" "}
            <Link to="/inscription" className="text-blue-600 hover:underline font-bold">
              Inscrivez-vous
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};

export default Login;
