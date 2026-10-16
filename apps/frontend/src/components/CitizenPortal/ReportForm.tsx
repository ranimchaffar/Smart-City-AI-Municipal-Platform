import React, { useState } from 'react';
import {
  Send,
  MapPin,
  Upload,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  FileCheck2,
  Image as ImageIcon,
  CheckCircle,
  Shield,
  Layers,
} from 'lucide-react';
import {
  submitMunicipalReport,
  uploadMediaFile,
  MunicipalReportRequest,
  MunicipalReportResponse,
} from '../../services/api';

interface ReportFormProps {
  onReportSubmitted: (response: MunicipalReportResponse, request: MunicipalReportRequest) => void;
}

const CATEGORIES_CONFIG = [
  { id: 'ROAD_DAMAGE', icon: '🛣️', label: 'Voirie & Chaussée', desc: 'Nids-de-poule, trottoirs fissurés, affaissements', fixture: 'mock://pothole' },
  { id: 'STREET_LIGHTING', icon: '💡', label: 'Éclairage Public', desc: 'Candélabres hors service, câbles apparents, feux', fixture: 'mock://streetlight' },
  { id: 'WASTE', icon: '🗑️', label: 'Propreté & Déchets', desc: 'Dépôts sauvages, conteneurs débordants, gravats', fixture: 'mock://waste' },
  { id: 'WATER_LEAK', icon: '💧', label: 'Réseaux d\'Eau', desc: 'Fuites sur chaussée, canalisations, bouches d\'égout', fixture: 'mock://water_leak' },
];

export const ReportForm: React.FC<ReportFormProps> = ({ onReportSubmitted }) => {
  const [reportId, setReportId] = useState(
    () => `RPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('ROAD_DAMAGE');
  const [description, setDescription] = useState(
    'Présence d\'un nid-de-poule profond sur la chaussée représentant un danger imminent pour la circulation des véhicules et deux-roues.'
  );
  const [mediaRef, setMediaRef] = useState('mock://pothole');
  const [address, setAddress] = useState('Avenue Habib Bourguiba, Tunis');
  const [latitude, setLatitude] = useState<number | null>(36.8008);
  const [longitude, setLongitude] = useState<number | null>(10.1800);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const generateNewId = () => {
    setReportId(`RPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setFormError('La géolocalisation n\'est pas prise en charge par votre navigateur.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
        setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
        setAddress('Position GPS détectée automatiquement');
        setFormError(null);
      },
      (err) => {
        setFormError(`Géolocalisation indisponible (${err.message}). Veuillez renseigner l'adresse manuellement.`);
      }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFormError(null);
    try {
      const res = await uploadMediaFile(file);
      setMediaRef(res.media_ref);
      setUploadSuccess(`Photographie "${file.name}" transmise avec succès (Chiffrement & Isolation sécurisée).`);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors du téléversement du fichier.');
    } finally {
      setIsUploading(false);
    }
  };

  const loadPreset = (preset: 'pothole' | 'mismatch' | 'reject' | 'outage') => {
    generateNewId();
    setUploadSuccess(null);
    setFormError(null);

    switch (preset) {
      case 'pothole':
        setSelectedCategory('ROAD_DAMAGE');
        setDescription('Nid-de-poule béant sur la chaussée causant des ralentissements et des risques de crevaison.');
        setMediaRef('mock://pothole');
        setAddress('Boulevard Zerktouni, Quartier Maarif');
        setLatitude(33.5892);
        setLongitude(-7.6187);
        break;

      case 'mismatch':
        setSelectedCategory('STREET_LIGHTING');
        setDescription('Lampadaire communal complètement éteint créant une zone obscure dangereuse.');
        setMediaRef('mock://pothole'); // Photo de nid-de-poule envoyée pour tester la divergence
        setAddress('Rue de Rome, Centre-Ville');
        setLatitude(36.8005);
        setLongitude(10.1812);
        break;

      case 'reject':
        setSelectedCategory('ROAD_DAMAGE');
        setDescription('Dégradation de la chaussée.');
        setMediaRef(''); // Preuve absente
        setAddress('Avenue de Paris');
        setLatitude(null);
        setLongitude(null);
        break;

      case 'outage':
        setSelectedCategory('ROAD_DAMAGE');
        setDescription('Affaissement de pavés nécessitant l\'application de la procédure officielle de voirie.');
        setMediaRef('mock://pothole');
        setAddress('Avenue Mohammed V');
        setLatitude(34.0209);
        setLongitude(-6.8416);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (description.trim().length < 5) {
      setFormError('La description doit contenir au minimum 5 caractères.');
      return;
    }

    setIsSubmitting(true);

    const payload: MunicipalReportRequest = {
      report_id: reportId.trim(),
      description: description.trim(),
      media_ref: mediaRef.trim(),
      location: (address || (latitude !== null && longitude !== null))
        ? {
            address: address.trim() || null,
            latitude,
            longitude,
          }
        : null,
    };

    try {
      const response = await submitMunicipalReport(payload);
      onReportSubmitted(response, payload);
    } catch (err: any) {
      setFormError(err.message || 'Échec de transmission au système central.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <Sparkles size={22} style={{ color: 'var(--primary)' }} />
            Signaler une Dégradation sur l'Espace Public
          </h2>
          <p className="form-hint">
            Votre signalement est instruit en temps réel par les agents d'orchestration municipale et consigné de manière pérenne.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={generateNewId}
          title="Générer une nouvelle clé d'idempotence"
        >
          <RefreshCw size={13} />
          Nouveau Dossier
        </button>
      </div>

      {/* Raccourcis de Test Scénarios d'Examen */}
      <div style={{ marginBottom: '24px', padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
          Scénarios de Démonstration Réglementaires (Conformes au Contrat n8n) :
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadPreset('pothole')}
          >
            ✅ Scénario 1 : Conforme (Voirie / PASS)
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadPreset('mismatch')}
          >
            ⚠️ Scénario 2 : Modération (Divergence Texte-Photo)
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadPreset('reject')}
          >
            ❌ Scénario 3 : Rejet (Preuve Manquante)
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadPreset('outage')}
          >
            🔍 Scénario 4 : Vérification RAG (Procédure)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Typologie d'incident */}
        <div className="form-group">
          <label className="form-label">Nature de la dégradation :</label>
          <div className="grid-4">
            {CATEGORIES_CONFIG.map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (mediaRef.startsWith('mock://')) setMediaRef(cat.fixture);
                }}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${selectedCategory === cat.id ? 'var(--primary)' : 'var(--border)'}`,
                  background: selectedCategory === cat.id ? 'var(--primary-subtle)' : 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{cat.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: selectedCategory === cat.id ? 'var(--primary)' : 'var(--text-main)' }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                  {cat.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Identifiant Unique */}
        <div className="form-group">
          <label className="form-label">Clé de suivi du signalement (Garantie d'Idempotence) :</label>
          <input
            type="text"
            className="form-input"
            value={reportId}
            onChange={(e) => setReportId(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}
            required
          />
          <div className="form-hint">
            Identifiant technique unique transmis au pipeline n8n et enregistré dans la table PostgreSQL <code>reports</code>.
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description précise des constatations :</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez précisément l'anomalie constatée, les risques éventuels et l'emplacement exact..."
            required
            rows={3}
          />
          <div className="form-hint">
            Minimum 5 caractères. La description est analysée par la Porte de Cohérence n8n (Porte 2).
          </div>
        </div>

        {/* Preuve Visuelle & Photo */}
        <div className="form-group">
          <label className="form-label">Photographie de constatation &amp; Preuve visuelle :</label>
          <div
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              marginBottom: '10px',
            }}
          >
            <ImageIcon size={32} style={{ color: 'var(--primary)', opacity: 0.7, marginBottom: '6px' }} />
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
              Téléverser un cliché de l'incident (JPEG, PNG, WebP)
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Limite : 10 Mo • Format conforme aux normes de sécurité municipale
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                <Upload size={14} />
                {isUploading ? 'Téléversement en cours...' : 'Sélectionner une photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* Référence active */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Référence média transmise :</span>
            <code style={{ background: 'var(--surface)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontWeight: 600 }}>
              {mediaRef || '(Aucune preuve sélectionnée)'}
            </code>
          </div>

          {uploadSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-pass)', fontSize: '0.8rem', marginTop: '6px' }}>
              <CheckCircle size={14} />
              {uploadSuccess}
            </div>
          )}

          {/* Avis de protection RGPD */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', background: 'var(--primary-subtle)', borderRadius: 'var(--radius-sm)', marginTop: '10px', fontSize: '0.78rem', color: 'var(--primary)' }}>
            <Shield size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Protection de la Vie Privée (RGPD) :</strong> Les clichés téléversés sont strictement isolés dans un répertoire sécurisé. Tout visage ou plaque minéralogique est masqué avant toute mise à disposition publique.
            </span>
          </div>
        </div>

        {/* Localisation */}
        <div className="form-group">
          <label className="form-label">Localisation géographique de l'intervention :</label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
            <input
              type="text"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adresse ou repère sur la voie publique..."
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDetectGps}
              style={{ flexShrink: 0 }}
            >
              <MapPin size={14} />
              Détecter GPS
            </button>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>Latitude : <strong>{latitude !== null ? latitude : 'N/A'}</strong></span>
            <span>Longitude : <strong>{longitude !== null ? longitude : 'N/A'}</strong></span>
          </div>
        </div>

        {formError && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--status-reject-subtle)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              color: 'var(--status-reject)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{formError}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || isUploading}
            style={{ minWidth: '220px', padding: '12px 24px', fontSize: '0.95rem' }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="pulse-glow" />
                Instruction en cours...
              </>
            ) : (
              <>
                <Send size={16} />
                Transmettre le Signalement
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
