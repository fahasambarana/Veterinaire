import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User, // For username
  Mail, // For email
  Lock, // For password
  Phone, // For phone
  Briefcase, // For role selection
  Syringe, // For vet specialties (or Stethoscope)
  Award, // For license number
  Hospital, // For clinic name
  MapPin, // For clinic address
  Clock, // For experience years
  UserPlus, // For register button
  Loader2, // For loading spinner
  Info, // For error/message alerts
} from 'lucide-react'; // Import Lucide icons

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
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for loading indicator
  const navigate = useNavigate();
  const { inscription } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for the specific field if it was previously set
    if (error && (name === 'password' || name === 'confirmPassword')) {
      if (formData.password === value || formData.confirmPassword === value) {
        setError('');
      }
    } else if (error && value.trim() !== '') {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true); // Start loading

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setIsSubmitting(false);
      return;
    }

    try {
      await inscription(formData);
      setMessage(`Bienvenue ${formData.username}, votre compte a été créé avec succès !`);
      // Use setTimeout to allow message to be seen before redirect
      setTimeout(() => {
        navigate("/login");
      }, 2000); // Redirect after 2 seconds
    } catch (err) {
      console.error("Inscription error:", err);
      setError(err.response?.data?.error || "Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false); // End loading
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 font-inter p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 animate-scale-in">
        <h2 className="text-4xl font-extrabold text-teal-700 mb-8 text-center">Créer un compte</h2>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-6 animate-fade-in-down" role="alert">
            <div className="flex items-center">
              <Info className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="block sm:inline font-medium">{message}</span>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 animate-fade-in-down" role="alert">
            <div className="flex items-center">
              <Info className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="block sm:inline font-medium">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main User Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input name="username" placeholder="Nom complet" value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 shadow-sm"
                required
                aria-label="Nom complet"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input name="email" type="email" placeholder="Email" value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 shadow-sm"
                required
                autoComplete="email"
                aria-label="Email"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input name="password" type="password" placeholder="Mot de passe" value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 shadow-sm"
                required
                autoComplete="new-password"
                aria-label="Mot de passe"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input name="confirmPassword" type="password" placeholder="Confirmez le mot de passe" value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 shadow-sm"
                required
                autoComplete="new-password"
                aria-label="Confirmez le mot de passe"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input name="phone" placeholder="Téléphone" value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 shadow-sm"
                aria-label="Téléphone"
              />
            </div>

            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select name="role" value={formData.role} onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer"
                aria-label="Rôle"
              >
                <option value="pet-owner">Propriétaire d'animal</option>
                <option value="vet">Vétérinaire</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          {/* VET FIELDS - Conditional rendering with transition */}
          {formData.role === "vet" && (
            <div className="mt-6 p-6 border border-teal-200 bg-teal-50 rounded-lg shadow-inner animate-fade-in space-y-4">
              <h4 className="text-xl font-bold text-teal-700 mb-4 text-center">Informations Vétérinaire</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <Syringe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input name="specialties" placeholder="Spécialités (ex: chien, chat...)" value={formData.specialties}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 shadow-sm"
                    aria-label="Spécialités"
                  />
                </div>

                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input name="licenseNumber" placeholder="Numéro de licence" value={formData.licenseNumber}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 shadow-sm"
                    aria-label="Numéro de licence"
                  />
                </div>

                <div className="relative">
                  <Hospital className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input name="clinicName" placeholder="Nom de la clinique" value={formData.clinicName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 shadow-sm"
                    aria-label="Nom de la clinique"
                  />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input name="clinicAddress" placeholder="Adresse de la clinique" value={formData.clinicAddress}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 shadow-sm"
                    aria-label="Adresse de la clinique"
                  />
                </div>

                <div className="relative col-span-1 md:col-span-2"> {/* Make this span full width on md screens */}
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input name="experienceYears" type="number" placeholder="Années d'expérience" value={formData.experienceYears}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 shadow-sm"
                    aria-label="Années d'expérience"
                  />
                </div>
              </div>
            </div>
          )}

          <button type="submit"
            className={`w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-lg font-semibold text-lg transition duration-300 transform shadow-md hover:shadow-lg hover:scale-105
              ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
            disabled={isSubmitting}
            aria-label="S'inscrire"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
            {isSubmitting ? "Inscription en cours..." : "S'inscrire"}
          </button>
        </form>

        <p className="mt-8 text-center text-base text-gray-600">
          Vous avez déjà un compte ?{" "}
          <Link to="/login" className="text-blue-600 hover:underline font-bold transition duration-200">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Inscription;
