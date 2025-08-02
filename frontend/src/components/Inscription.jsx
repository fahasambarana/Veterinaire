import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User, Mail, Lock, Phone, Briefcase, 
  Syringe, Award, Hospital, MapPin, Clock,
  UserPlus, Loader2, Info
} from 'lucide-react';
import BackgroundImage from '../assets/dog.jpg'; // Add your background image path

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { inscription } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setIsSubmitting(false);
      return;
    }

    try {
      await inscription(formData);
      setMessage(`Bienvenue ${formData.username}, votre compte a été créé avec succès !`);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={BackgroundImage} 
          alt="Veterinary clinic background"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/70 to-blue-900/70 backdrop-blur-[2px]"></div>
      </div>

      {/* Main form container */}
      <div className="relative z-10 bg-white/95 p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-white/20 backdrop-blur-sm transform transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-teal-400/10 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-blue-400/10 animate-pulse delay-300"></div>

        <h2 className="text-4xl font-extrabold text-teal-700 mb-8 text-center animate-fade-in">
          Créer un compte
        </h2>

        {/* Messages */}
        {message && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg mb-6 animate-fade-in-down">
            <div className="flex items-start">
              <Info className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              <span className="font-medium">{message}</span>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 animate-fade-in-down">
            <div className="flex items-start">
              <Info className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main User Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: User, name: 'username', placeholder: 'Nom complet', type: 'text', required: true },
              { icon: Mail, name: 'email', placeholder: 'Email', type: 'email', required: true },
              { icon: Lock, name: 'password', placeholder: 'Mot de passe', type: 'password', required: true },
              { icon: Lock, name: 'confirmPassword', placeholder: 'Confirmez le mot de passe', type: 'password', required: true },
              { icon: Phone, name: 'phone', placeholder: 'Téléphone', type: 'text' },
            ].map((field, index) => (
              <div key={field.name} className={`relative animate-fade-in-up delay-${index * 100}`}>
                <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-all duration-300 group-focus-within:text-teal-500" />
                <input
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 shadow-sm hover:shadow-md group"
                  required={field.required}
                  aria-label={field.placeholder}
                />
              </div>
            ))}

            {/* Role Selector */}
            <div className="relative animate-fade-in-up delay-500">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-all duration-300 group-focus-within:text-teal-500" />
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 shadow-sm hover:shadow-md appearance-none cursor-pointer group"
                aria-label="Rôle"
              >
                <option value="pet-owner">Propriétaire d'animal</option>
                <option value="vet">Vétérinaire</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* VET FIELDS - Conditional rendering */}
          {formData.role === "vet" && (
            <div className="mt-6 p-6 border border-teal-200 bg-teal-50/80 rounded-lg shadow-inner animate-fade-in space-y-4 backdrop-blur-sm">
              <h4 className="text-xl font-bold text-teal-700 mb-4 text-center flex items-center justify-center">
                <Syringe className="w-5 h-5 mr-2" />
                Informations Vétérinaire
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: Syringe, name: 'specialties', placeholder: 'Spécialités (ex: chien, chat...)' },
                  { icon: Award, name: 'licenseNumber', placeholder: 'Numéro de licence' },
                  { icon: Hospital, name: 'clinicName', placeholder: 'Nom de la clinique' },
                  { icon: MapPin, name: 'clinicAddress', placeholder: 'Adresse de la clinique' },
                  { icon: Clock, name: 'experienceYears', placeholder: 'Années d\'expérience', type: 'number', fullWidth: true },
                ].map((field, index) => (
                  <div 
                    key={field.name} 
                    className={`relative ${field.fullWidth ? 'md:col-span-2' : ''} animate-fade-in-up delay-${600 + index * 100}`}
                  >
                    <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-all duration-300 group-focus-within:text-teal-500" />
                    <input
                      name={field.name}
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={formData[field.name]}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 shadow-sm hover:shadow-md group"
                      aria-label={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="animate-fade-in-up delay-1000">
            <button
              type="submit"
              className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white p-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl group
                ${isSubmitting ? "opacity-80 cursor-not-allowed" : ""}`}
              disabled={isSubmitting}
              aria-label="S'inscrire"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  <span>S'inscrire</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="animate-fade-in-up delay-1100">
          <p className="mt-8 text-center text-base text-gray-700">
            Vous avez déjà un compte ?{" "}
            <Link 
              to="/login" 
              className="text-teal-600 hover:text-teal-700 font-bold transition-all duration-300 hover:underline underline-offset-4"
            >
              Connectez-vous
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Inscription;