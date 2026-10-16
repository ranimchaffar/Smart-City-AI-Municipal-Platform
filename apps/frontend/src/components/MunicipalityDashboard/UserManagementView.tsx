import React, { useState, useEffect } from 'react';
import {
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  fetchAuditLogs,
  UserProfile,
  AuditLogRecord,
} from '../../services/api';
import {
  Users,
  UserPlus,
  Shield,
  Briefcase,
  CheckCircle,
  XCircle,
  History,
  RefreshCw,
  Search,
  AlertCircle,
  Lock,
  Mail,
  User,
  Phone,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal for new agent
  const [isNewAgentModalOpen, setIsNewAgentModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentPassword, setNewAgentPassword] = useState('');
  const [newAgentDepartment, setNewAgentDepartment] = useState('ROADS_DEPARTMENT');
  const [newAgentRole, setNewAgentRole] = useState<'MUNICIPAL_AGENT' | 'ADMINISTRATOR'>('MUNICIPAL_AGENT');
  const [newAgentPhone, setNewAgentPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userData, logData] = await Promise.all([
        fetchAdminUsers(),
        fetchAuditLogs(),
      ]);
      setUsers(userData.users || []);
      setAuditLogs(logData.logs || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données d’administration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (newAgentPassword.length < 8) {
      setFormError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    try {
      await createAdminUser({
        name: newAgentName.trim(),
        email: newAgentEmail.trim(),
        password: newAgentPassword,
        role: newAgentRole,
        department: newAgentRole === 'MUNICIPAL_AGENT' ? newAgentDepartment : null,
        phone: newAgentPhone.trim() || null,
      });

      setFormSuccess('Compte agent créé avec succès !');
      setTimeout(() => {
        setIsNewAgentModalOpen(false);
        setNewAgentName('');
        setNewAgentEmail('');
        setNewAgentPassword('');
        setNewAgentPhone('');
        loadData();
      }, 700);
    } catch (err: any) {
      setFormError(err.message || 'Échec de création du compte.');
    }
  };

  const handleToggleActive = async (user: UserProfile) => {
    try {
      await updateAdminUser(user.id, {
        is_active: !user.is_active,
      });
      loadData();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleDepartmentChange = async (userId: string, newDept: string) => {
    try {
      await updateAdminUser(userId, {
        department: newDept || null,
      });
      loadData();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateAdminUser(userId, {
        role: newRole,
      });
      loadData();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMINISTRATOR':
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>Administrateur</span>;
      case 'MUNICIPAL_AGENT':
        return <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>Agent Municipal</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>Citoyen</span>;
    }
  };

  const getDepartmentLabel = (dept: string | null) => {
    if (!dept) return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>;
    const map: Record<string, string> = {
      ROADS_DEPARTMENT: 'Voirie & Chaussées',
      PUBLIC_LIGHTING_DEPARTMENT: 'Éclairage Public',
      SANITATION_DEPARTMENT: 'Propreté & Déchets',
      WATER_SERVICES_DEPARTMENT: 'Réseau d’Eau Potable',
    };
    return map[dept] || dept;
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={22} style={{ color: '#2563eb' }} />
            Administration des Utilisateurs & Audits
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Gestion centralisée des rôles, affectations de départements et journaux de sécurité
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('users')}
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            <Users size={14} style={{ marginRight: '6px' }} />
            Utilisateurs ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            <History size={14} style={{ marginRight: '6px' }} />
            Journaux d’audit ({auditLogs.length})
          </button>
          <button
            onClick={() => setIsNewAgentModalOpen(true)}
            className="btn btn-primary"
            style={{ background: '#16a34a', borderColor: '#16a34a', fontSize: '13px', padding: '8px 16px' }}
          >
            <UserPlus size={14} style={{ marginRight: '6px' }} />
            Créer un agent
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 1. USERS TAB */}
      {activeTab === 'users' && (
        <>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Rechercher par nom, email, département..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', background: '#ffffff' }}
            >
              <option value="ALL">Tous les rôles</option>
              <option value="ADMINISTRATOR">Administrateurs</option>
              <option value="MUNICIPAL_AGENT">Agents Municipaux</option>
              <option value="CITIZEN">Citoyens</option>
            </select>

            <button onClick={loadData} className="btn btn-secondary btn-sm" title="Actualiser">
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
            </button>
          </div>

          {/* Users Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Utilisateur</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Email</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Rôle</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Département Assigné</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Statut</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</div>
                      {u.phone && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.phone}</div>}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px', background: '#ffffff', fontWeight: 600 }}
                      >
                        <option value="CITIZEN">Citoyen</option>
                        <option value="MUNICIPAL_AGENT">Agent Municipal</option>
                        <option value="ADMINISTRATOR">Administrateur</option>
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {u.role === 'MUNICIPAL_AGENT' ? (
                        <select
                          value={u.department || 'ROADS_DEPARTMENT'}
                          onChange={(e) => handleDepartmentChange(u.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px', background: '#ffffff' }}
                        >
                          <option value="ROADS_DEPARTMENT">Voirie & Chaussées</option>
                          <option value="PUBLIC_LIGHTING_DEPARTMENT">Éclairage Public</option>
                          <option value="SANITATION_DEPARTMENT">Propreté & Déchets</option>
                          <option value="WATER_SERVICES_DEPARTMENT">Réseau d’Eau Potable</option>
                        </select>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Non applicable</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {u.is_active ? (
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={11} /> Actif
                        </span>
                      ) : (
                        <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={11} /> Inactif
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleActive(u)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      >
                        {u.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 2. AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Horodatage</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Action</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Ressource</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Identifiant</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Détails</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucune entrée d'audit enregistrée pour le moment.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.log_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 700, color: '#1e3a8a', background: '#eff6ff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      {log.resource_type}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px' }}>
                      {log.resource_id || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '300px' }}>
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: CREATE NEW MUNICIPAL AGENT */}
      {isNewAgentModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewAgentModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Créer un compte Agent Municipal</h3>
              <button onClick={() => setIsNewAgentModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>

            {formError && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', marginBottom: '12px' }}>
                {formError}
              </div>
            )}
            {formSuccess && (
              <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#15803d', fontSize: '12px', marginBottom: '12px' }}>
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateAgent}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Nom et prénom de l'agent</label>
                <input
                  type="text"
                  required
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="Ex. Mohamed Trabelsi"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Email professionnel</label>
                <input
                  type="email"
                  required
                  value={newAgentEmail}
                  onChange={(e) => setNewAgentEmail(e.target.value)}
                  placeholder="agent@ville-intelligente.tn"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Mot de passe initial</label>
                <input
                  type="password"
                  required
                  value={newAgentPassword}
                  onChange={(e) => setNewAgentPassword(e.target.value)}
                  placeholder="Minimum 8 caractères (haché Argon2id)"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Rôle administratif</label>
                <select
                  value={newAgentRole}
                  onChange={(e: any) => setNewAgentRole(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', background: '#ffffff' }}
                >
                  <option value="MUNICIPAL_AGENT">Agent Municipal</option>
                  <option value="ADMINISTRATOR">Administrateur</option>
                </select>
              </div>

              {newAgentRole === 'MUNICIPAL_AGENT' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Département d'intervention</label>
                  <select
                    value={newAgentDepartment}
                    onChange={(e) => setNewAgentDepartment(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', background: '#ffffff' }}
                  >
                    <option value="ROADS_DEPARTMENT">Voirie & Chaussées</option>
                    <option value="PUBLIC_LIGHTING_DEPARTMENT">Éclairage Public</option>
                    <option value="SANITATION_DEPARTMENT">Propreté & Déchets</option>
                    <option value="WATER_SERVICES_DEPARTMENT">Réseau d’Eau Potable</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px', fontWeight: 600, fontSize: '13px' }}
              >
                Créer l'agent
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
