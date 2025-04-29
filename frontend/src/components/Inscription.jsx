import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Inscription = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'pet-owner',
    specialties: '',
    licenseNumber: '',
    clinicName: '',
    clinicAddress: '',
    experienceYears: ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { inscription } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      await inscription(formData);
      setMessage(`Bienvenue ${formData.username}, votre compte a été créé.`);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-white">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Créer un compte</h2>

        {message && <p className="text-green-600 text-center mb-4">{message}</p>}
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 2 Columns Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input name="username" placeholder="Nom complet" value={formData.username}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required />

            <input name="email" type="email" placeholder="Email" value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required />

            <input name="password" type="password" placeholder="Mot de passe" value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required />

            <input name="confirmPassword" type="password" placeholder="Confirmez le mot de passe" value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required />

            <input name="phone" placeholder="Téléphone" value={formData.phone}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />

            <select name="role" value={formData.role} onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="pet-owner">Propriétaire</option>
              <option value="vet">Vétérinaire</option>
            </select>
          </div>

          {/* VET FIELDS */}
          {formData.role === "vet" && (
            <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-md">
              <h4 className="text-blue-700 font-semibold mb-3">Informations Vétérinaire</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="specialties" placeholder="Spécialités (ex: chien, chat...)" value={formData.specialties}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded" />

                <input name="licenseNumber" placeholder="Numéro de licence" value={formData.licenseNumber}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded" />

                <input name="clinicName" placeholder="Nom de la clinique" value={formData.clinicName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded" />

                <input name="clinicAddress" placeholder="Adresse de la clinique" value={formData.clinicAddress}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded" />

                <input name="experienceYears" type="number" placeholder="Années d'expérience" value={formData.experienceYears}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded" />
              </div>
            </div>
          )}

          <button type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-semibold transition duration-200">
            S'inscrire
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Si vous avez déjà un compte, <Link to="/login" className="text-blue-600 hover:underline">connectez-vous</Link>
        </p>
      </div>
    </div>
  );
};

export default Inscription;
