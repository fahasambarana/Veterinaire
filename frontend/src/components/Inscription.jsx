import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Inscription = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPAssword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 🔹 Check if passwords match
    if (password !== confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas !");
      return false;
    }

    setLoading(true);

    try {
      await axios.post("http://localhost:5000/api/user/register", {
        username,
        email,
        password,
      });

      setMessage("Inscription réussie !");
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error(error);
      setMessage("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 shadow-lg rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Inscription</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-gray-600 font-medium">Nom d'utilisateur</label>
            <input
              className="w-full mt-1 p-2 rounded-lg focus:outline-none border border-gray-300 focus:ring-2 focus:ring-blue-400"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Entrez votre nom"
            />
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@..."
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Mot de passe</label>
            <input
              type="password"
              className="w-full p-2 border rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Votre mot de passe..."
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              className="w-full p-2 border rounded-lg"
              value={confirmPassword}
              onChange={(e) => setConfirmPAssword(e.target.value)}
              required
              placeholder="Confirmez votre mot de passe..."
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
          >
            S'inscrire
          </button>
          {message && <p className="text-red-500">{message}</p>}
        </form>
        <p>Si vous avez deja un compte,<Link className="text-blue-500" to="/">Connectez-vous</Link> </p>
      </div>
    </div>
  );
};

export default Inscription;
