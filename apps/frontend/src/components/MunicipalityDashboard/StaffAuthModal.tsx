import React, { useState } from 'react';
import { Lock, Key, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import { isStaffAuthenticated, loginStaff, logoutStaff } from '../../services/api';

interface StaffAuthModalProps {
  onAuthChange: () => void;
}

export const StaffAuthModal: React.FC<StaffAuthModalProps> = ({ onAuthChange }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const isAuthenticated = isStaffAuthenticated();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const result = await loginStaff(tokenInput);
    setIsSubmitting(false);

    if (result.success) {
      setTokenInput('');
      setIsOpen(false);
      onAuthChange();
    } else {
      setError(result.error || 'Échec de l\'authentification. Jeton invalide.');
    }
  };

  const handleLogout = () => {
    logoutStaff();
    onAuthChange();
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          background: isAuthenticated ? 'var(--status-pass-subtle)' : 'var(--status-reject-subtle)',
          border: `1px solid ${isAuthenticated ? 'rgba(5, 150, 105, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          {isAuthenticated ? (
            <>
              <CheckCircle size={16} style={{ color: 'var(--status-pass)' }} />
              <span style={{ fontWeight: 600, color: 'var(--status-pass)' }}>
                Session Agent Municipal : Authentifiée
              </span>
              <span style={{ color: 'var(--text-muted)' }}>• Droits de modération et d'arbitrage actifs</span>
            </>
          ) : (
            <>
              <Lock size={16} style={{ color: 'var(--status-reject)' }} />
              <span style={{ fontWeight: 600, color: 'var(--status-reject)' }}>
                Session Agent Municipal : Non Authentifiée (Lecture Seule)
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                • Jeton requis pour arbitrer la file de modération ou modifier un statut
              </span>
            </>
          )}
        </div>

        <div>
          {isAuthenticated ? (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
            >
              <LogOut size={13} />
              Déconnexion
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsOpen(!isOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
            >
              <Key size={13} />
              Connexion Agent
            </button>
          )}
        </div>
      </div>

      {!isAuthenticated && isOpen && (
        <form
          onSubmit={handleLogin}
          style={{
            marginTop: '8px',
            padding: '14px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
            Saisir le jeton d'authentification Bearer (configuré via STAFF_AUTH_TOKEN) :
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="password"
              placeholder="ex. municipal-staff-secret-2026"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="form-input"
              style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isSubmitting || !tokenInput.trim()}
            >
              {isSubmitting ? 'Vérification...' : 'Valider la Session'}
            </button>
          </div>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--status-reject)',
                fontSize: '0.78rem',
              }}
            >
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </form>
      )}
    </div>
  );
};
