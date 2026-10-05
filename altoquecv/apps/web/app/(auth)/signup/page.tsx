'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, IdCard, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Validaciones (Estado Derivado)
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isValidRut = /^[0-9]{7,8}-[0-9kK]{1}$/.test(formData.rut); // Formato: 12345678-9
  const isNameValid = formData.nombre.trim().length >= 3;
  const isPasswordValid = formData.password.length >= 8;
  const passwordsMatch = formData.password === formData.confirmPassword && isPasswordValid;

  const isFormValid = isValidEmail && isValidRut && isNameValid && isPasswordValid && passwordsMatch;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setIsSubmitting(true);
    // Simulación de llamada a API
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/validar-correo');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-border rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-primary text-white rounded-lg font-bold text-xl flex items-center justify-center mx-auto mb-4">A</div>
          <h1 className="text-2xl font-bold text-on-surface">Crea tu Perfil Maestro</h1>
          <p className="text-sm text-on-surface-variant mt-2">Centraliza tu empleabilidad en un solo lugar.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Nombre Completo</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej. Camila San Martín" className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-border rounded-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">RUT (Sin puntos, con guion)</label>
            <div className="relative">
              <IdCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input type="text" name="rut" value={formData.rut} onChange={handleChange} placeholder="12345678-9" className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-border rounded-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Correo Electrónico</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="correo@ejemplo.com" className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-border rounded-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Mín. 8 caract." className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-border rounded-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Confirmar</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repetir" className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-border rounded-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full mt-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
              isFormValid && !isSubmitting
                ? 'bg-primary text-white hover:shadow-lg hover:opacity-90'
                : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-70'
            }`}
          >
            {isSubmitting ? 'Creando cuenta...' : 'Comenzar Gratis'}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          ¿Ya tienes cuenta? <Link href="/login" className="text-primary font-semibold hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}