import React, { useState } from 'react';
import {
  loginUser,
  registerCitizen,
  requestPasswordReset,
  confirmPasswordReset,
  updateProfile,
  logoutUser,
  UserProfile,
} from '../services/api';
import { LogIn, UserPlus, KeyRound, Shield, UserCheck, AlertCircle, CheckCircle2, LogOut, ArrowRight, RefreshCw } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onAuthSuccess: (user: UserProfile) => void;
  onLogout: () => void;
  initialMode?: 'login' | 'register' | 'forgot' | 'profile';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onLogout,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset' | 'profile'>(
    currentUser ? 'profile' : initialMode
  );

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await loginUser(email, password);
    setLoading(false);

    if (res.success && res.user) {
      setSuccessMessage('Connexion réussie !');
      onAuthSuccess(res.user);
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setErrorMessage(res.error || 'Identifiants invalides');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères.');
      setLoading(false);
      return;
    }

    const res = await registerCitizen(name, email, password, phone);
    setLoading(false);

    if (res.success && res.user) {
      setSuccessMessage('Compte citoyen créé avec succès !');
      onAuthSuccess(res.user);
      setTimeout(() => {
        onClose();
      }, 600);
    } else {
      setErrorMessage(res.error || 'Erreur lors de l’inscription.');
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await requestPasswordReset(email);
    setLoading(false);

    if (res.success) {
      setSuccessMessage(
        res.reset_token
          ? `Jeton généré pour les tests : ${res.reset_token}`
          : 'Un lien de réinitialisation vous a été envoyé par email.'
      );
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
      setMode('reset');
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      setLoading(false);
      return;
    }

    const res = await confirmPasswordReset(resetToken, newPassword);
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Mot de passe mis à jour ! Vous pouvez vous connecter.');
      setTimeout(() => {
        setMode('login');
        setPassword('');
      }, 1200);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await updateProfile(name || undefined, phone || undefined);
    setLoading(false);

    if (res.success && res.user) {
      setSuccessMessage('Profil mis à jour avec succès.');
      onAuthSuccess(res.user);
    } else {
      setErrorMessage(res.error || 'Impossible de mettre à jour le profil.');
    }
  };

  const handleLogoutClick = async () => {
    setLoading(true);
    await logoutUser();
    setLoading(false);
    onLogout();
    onClose();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMINISTRATOR':
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>Administrateur Système</span>;
      case 'MUNICIPAL_AGENT':
        return <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>Agent Municipal</span>;
      default:
        return <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>Citoyen</span>;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '90%',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          padding: '28px',
        }}
      >
        {/* Header & Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              {mode === 'login' && 'Connexion à votre espace'}
              {mode === 'register' && 'Créer un compte citoyen'}
              {mode === 'forgot' && 'Mot de passe oublié'}
              {mode === 'reset' && 'Nouveau mot de passe'}
              {mode === 'profile' && 'Mon Profil Personnel'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Ville Intelligente — Portail Sécurisé
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab switch buttons (if not logged in) */}
        {!currentUser && (
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '4px',
              borderRadius: '10px',
              marginBottom: '20px',
            }}
          >
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(null); setSuccessMessage(null); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: '8px',
                background: mode === 'login' ? '#ffffff' : 'transparent',
                fontWeight: mode === 'login' ? 600 : 500,
                color: mode === 'login' ? 'var(--text-main)' : 'var(--text-muted)',
                boxShadow: mode === 'login' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <LogIn size={14} />
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMessage(null); setSuccessMessage(null); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: '8px',
                background: mode === 'register' ? '#ffffff' : 'transparent',
                fontWeight: mode === 'register' ? 600 : 500,
                color: mode === 'register' ? 'var(--text-main)' : 'var(--text-muted)',
                boxShadow: mode === 'register' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <UserPlus size={14} />
              Inscription
            </button>
          </div>
        )}

        {/* Feedback messages */}
        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: '10px 14px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              color: '#15803d',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. LOGIN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Adresse email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.tn"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                  background: '#ffffff',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setErrorMessage(null); setSuccessMessage(null); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                  background: '#ffffff',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? <RefreshCw size={16} className="spin" /> : <LogIn size={16} />}
              Se connecter
            </button>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
              Comptes de test disponibles :<br />
              <code style={{ fontSize: '11px', color: '#1e293b' }}>citoyen.test@ville-intelligente.tn</code> (Citoyen)<br />
              <code style={{ fontSize: '11px', color: '#1e293b' }}>agent.voirie@ville-intelligente.tn</code> (Agent Municipal)<br />
              <code style={{ fontSize: '11px', color: '#1e293b' }}>admin@ville-intelligente.tn</code> (Administrateur)
            </div>
          </form>
        )}

        {/* 2. REGISTER MODE (CITIZEN ONLY) */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-main)' }}>
                Nom et prénom
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Yassine Ben Amor"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-main)' }}>
                Adresse email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.tn"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-main)' }}>
                Numéro de téléphone (optionnel)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+216 20 000 000"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-main)' }}>
                Mot de passe (minimum 8 caractères)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? <RefreshCw size={16} className="spin" /> : <UserPlus size={16} />}
              Créer mon compte citoyen
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD MODE */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Saisissez l'adresse email associée à votre compte. Un jeton sécurisé à usage unique vous sera délivré pour réinitialiser votre mot de passe.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Adresse email de récupération
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.tn"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? <RefreshCw size={16} className="spin" /> : <KeyRound size={16} />}
              Demander la réinitialisation
            </button>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Retour à la connexion
              </button>
            </div>
          </form>
        )}

        {/* 4. RESET PASSWORD MODE */}
        {mode === 'reset' && (
          <form onSubmit={handleReset}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-main)' }}>
                Jeton de réinitialisation
              </label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Collez le jeton reçu"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-main)' }}>
                Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              {loading ? 'Validation en cours...' : 'Mettre à jour mon mot de passe'}
            </button>
          </form>
        )}

        {/* 5. USER PROFILE MODE */}
        {mode === 'profile' && currentUser && (
          <div>
            <div
              style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {currentUser.name}
                </span>
                {getRoleBadge(currentUser.role)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <strong>Email :</strong> {currentUser.email}
              </div>
              {currentUser.department && (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <strong>Département :</strong> {currentUser.department}
                </div>
              )}
              {currentUser.phone && (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <strong>Téléphone :</strong> {currentUser.phone}
                </div>
              )}
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                <strong>Membre depuis :</strong> {new Date(currentUser.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>

            {/* Profile update form */}
            <form onSubmit={handleUpdateProfile} style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Modifier votre nom
                </label>
                <input
                  type="text"
                  value={name}
                  placeholder={currentUser.name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Modifier votre téléphone
                </label>
                <input
                  type="tel"
                  value={phone}
                  placeholder={currentUser.phone || '+216 ...'}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', padding: '8px' }}
              >
                {loading ? 'Mise à jour...' : 'Enregistrer les modifications'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleLogoutClick}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #fee2e2',
                background: '#fff1f2',
                color: '#be123c',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              <LogOut size={15} />
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
