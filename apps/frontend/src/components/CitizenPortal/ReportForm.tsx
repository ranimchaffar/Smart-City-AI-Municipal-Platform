import React, { useState } from 'react';
import {
  FileText,
  User,
  Lightbulb,
  Hammer,
  Printer,
  Upload,
  Video,
  Check,
  AlertTriangle,
  MapPin,
  CheckCircle,
  Shield,
  Sparkles,
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

interface ServiceCardConfig {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: 'code' | 'sidewalk' | 'streetlight' | 'pothole';
  defaultDesc: string;
  defaultFixture: string;
  questionLabel: string;
}

const SERVICES_CONFIG: ServiceCardConfig[] = [
  {
    id: 'code-violation',
    category: 'WASTE',
    title: 'Code Violation',
    subtitle: 'Report code violation',
    icon: 'code',
    defaultDesc: 'Illegal waste deposit and municipal code violation blocking public walkway.',
    defaultFixture: 'mock://waste',
    questionLabel: 'How long has violation been present?',
  },
  {
    id: 'sidewalk-repair',
    category: 'ROAD_DAMAGE',
    title: 'Sidewalk Repair',
    subtitle: 'Request a sidewalk repair',
    icon: 'sidewalk',
    defaultDesc: 'Cracked concrete slabs and uneven pavement presenting severe pedestrian tripping hazard.',
    defaultFixture: 'mock://pothole',
    questionLabel: 'How long has sidewalk been damaged?',
  },
  {
    id: 'street-lights',
    category: 'STREET_LIGHTING',
    title: 'Street lights',
    subtitle: 'Report broken street light',
    icon: 'streetlight',
    defaultDesc: 'Public lighting column offline with exposed wiring, dark intersection hazard.',
    defaultFixture: 'mock://streetlight',
    questionLabel: 'How long has street light been out of service?',
  },
  {
    id: 'pothole-repair',
    category: 'ROAD_DAMAGE',
    title: 'Pothole Repair',
    subtitle: 'Request pothole repair',
    icon: 'pothole',
    defaultDesc: 'Deep pothole on main transit corridor risking vehicle chassis and two-wheeler accidents.',
    defaultFixture: 'mock://pothole',
    questionLabel: 'How long has pothole been on roadway?',
  },
];

export const ReportForm: React.FC<ReportFormProps> = ({ onReportSubmitted }) => {
  const [selectedService, setSelectedService] = useState<ServiceCardConfig>(SERVICES_CONFIG[1]); // Default to Sidewalk Repair (matching Reference Image 2)
  const [reportId, setReportId] = useState(
    () => `RPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [address, setAddress] = useState('Avenue Habib Bourguiba, Tunis');
  const [zipCode, setZipCode] = useState('1001');
  const [description, setDescription] = useState(SERVICES_CONFIG[1].defaultDesc);
  const [durationObserved, setDurationObserved] = useState('2 to 4 weeks');
  const [includesAdaRamp, setIncludesAdaRamp] = useState(true);
  const [mediaRef, setMediaRef] = useState(SERVICES_CONFIG[1].defaultFixture);

  const [latitude, setLatitude] = useState<number | null>(36.8008);
  const [longitude, setLongitude] = useState<number | null>(10.1800);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const generateNewId = () => {
    setReportId(`RPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleSelectService = (srv: ServiceCardConfig) => {
    setSelectedService(srv);
    setDescription(srv.defaultDesc);
    setMediaRef(srv.defaultFixture);
    setUploadSuccess(null);
    setFormError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFormError(null);
    try {
      const res = await uploadMediaFile(file);
      setMediaRef(res.media_ref);
      setUploadSuccess(`Evidence photo "${file.name}" attached securely.`);
    } catch (err: any) {
      setFormError(err.message || 'Error uploading evidence file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setFormError('Geolocation not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
        setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
        setAddress('Auto-detected GPS Location');
        setFormError(null);
      },
      (err) => {
        setFormError(`GPS unavailable: ${err.message}. Please enter address manually.`);
      }
    );
  };

  const loadPreset = (preset: 'pothole' | 'mismatch' | 'reject' | 'outage') => {
    generateNewId();
    setUploadSuccess(null);
    setFormError(null);

    switch (preset) {
      case 'pothole':
        handleSelectService(SERVICES_CONFIG[3]); // Pothole Repair
        setDescription('Deep pothole on main transit corridor risking vehicle chassis damage.');
        setMediaRef('mock://pothole');
        setAddress('Avenue Habib Bourguiba, Tunis');
        setZipCode('1001');
        break;
      case 'mismatch':
        handleSelectService(SERVICES_CONFIG[2]); // Street lights
        setDescription('Broken public street light pole near Central Market.');
        setMediaRef('mock://streetlight');
        setAddress('Rue de Rome, Tunis');
        setZipCode('1002');
        break;
      case 'reject':
        handleSelectService(SERVICES_CONFIG[0]); // Code Violation
        setDescription('Accumulated garbage with no evidence attached.');
        setMediaRef('');
        setAddress('Rue de Hollande, Tunis');
        setZipCode('1000');
        break;
      case 'outage':
        handleSelectService(SERVICES_CONFIG[1]); // Sidewalk Repair
        setDescription('Sidewalk damage requiring municipal regulation check.');
        setMediaRef('mock://pothole');
        setAddress('Avenue de Paris, Tunis');
        setZipCode('1001');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!description.trim()) {
      setFormError('Please enter a description of the observed issue.');
      return;
    }

    const payload: MunicipalReportRequest = {
      report_id: reportId,
      description: description.trim(),
      category_hint: selectedService.category,
      media_ref: mediaRef,
      location: {
        address: `${address.trim()}${zipCode ? `, ${zipCode.trim()}` : ''}`,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      },
    };

    setIsSubmitting(true);
    try {
      const response = await submitMunicipalReport(payload);
      onReportSubmitted(response, payload);
      generateNewId();
    } catch (err: any) {
      setFormError(err.message || 'Submission error. Please verify input fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Icon renderer matching Reference Image 2 line-art style
  const renderServiceIcon = (iconType: string) => {
    switch (iconType) {
      case 'code':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <FileText size={22} strokeWidth={1.8} />
          </div>
        );
      case 'sidewalk':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <User size={22} strokeWidth={1.8} />
          </div>
        );
      case 'streetlight':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Lightbulb size={22} strokeWidth={1.8} />
          </div>
        );
      case 'pothole':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Hammer size={22} strokeWidth={1.8} />
          </div>
        );
      default:
        return <FileText size={22} />;
    }
  };

  return (
    <div className="citizen-portal-wrap">
      <div className="citizen-grid-layout">
        {/* ============================================================== */}
        {/* LEFT COLUMN: Service Selection Cards (Reference Image 2)      */}
        {/* ============================================================== */}
        <div className="citizen-services-col">
          <h1 className="citizen-main-headline">
            Citizen Services /<br />Streets and Sidewalks
          </h1>

          <div className="services-2x2-grid">
            {SERVICES_CONFIG.map((srv) => {
              const isActive = selectedService.id === srv.id;
              return (
                <div
                  key={srv.id}
                  className={`service-selection-card ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectService(srv)}
                >
                  <div className="service-icon-box">
                    {renderServiceIcon(srv.icon)}
                  </div>
                  <div className="service-card-title">{srv.title}</div>
                  <div className="service-card-subtitle">{srv.subtitle}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: Citizen Form Card (Reference Image 2)            */}
        {/* ============================================================== */}
        <div className="citizen-form-card">
          <div className="form-card-header">
            <h2 className="form-service-title">{selectedService.title}</h2>
            <button
              type="button"
              className="btn-print-form"
              onClick={() => window.print()}
            >
              <Printer size={15} />
              Print Form
            </button>
          </div>

          {/* Form Warning / Status Notice matching Reference Image 2 */}
          <div className="form-alert-banner">
            <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div className="form-alert-line" />
          </div>

          <div className="form-instructions-lead">
            Please complete the details below as part of your submission.
          </div>

          <form onSubmit={handleSubmit}>
            {/* Address & Zip Row */}
            <div className="form-row-2col">
              <div className="form-field-group">
                <label className="form-field-label">Address</label>
                <input
                  type="text"
                  className="form-input-clean"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Avenue Habib Bourguiba, Tunis"
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Zip</label>
                <input
                  type="text"
                  className="form-input-clean"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="e.g. 1001"
                />
              </div>
            </div>

            {/* Description Textarea */}
            <div className="form-field-group">
              <label className="form-field-label">Please describe issue</label>
              <textarea
                className="form-textarea-clean"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe exact location, dimensions, risks, or landmark references..."
                required
              />
            </div>

            {/* Upload Buttons Row matching Reference Image 2 */}
            <div className="media-upload-row">
              <label className="btn-upload-capsule">
                <Upload size={14} />
                <span>{isUploading ? 'Uploading...' : 'Upload Photos (optional)'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>

              <label className="btn-upload-capsule">
                <Video size={14} />
                <span>Upload Video (optional)</span>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>

              <button
                type="button"
                className="btn-upload-capsule"
                onClick={handleDetectGps}
                title="Detect current GPS coordinates"
                style={{ marginLeft: 'auto' }}
              >
                <MapPin size={14} />
                <span>GPS Auto</span>
              </button>
            </div>

            {/* Media status pill */}
            {uploadSuccess && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: 'var(--green-dark)',
                  background: 'var(--green-subtle)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '14px',
                }}
              >
                <CheckCircle size={14} />
                {uploadSuccess}
              </div>
            )}

            {/* Duration Observed Input matching Reference Image 2 */}
            <div className="form-field-group">
              <label className="form-field-label">{selectedService.questionLabel}</label>
              <input
                type="text"
                className="form-input-clean"
                value={durationObserved}
                onChange={(e) => setDurationObserved(e.target.value)}
                placeholder="e.g. First observed 2 days ago after heavy rainfall"
              />
            </div>

            {/* ADA Ramp Checkbox matching Reference Image 2 */}
            <div
              className="custom-checkbox-row"
              onClick={() => setIncludesAdaRamp(!includesAdaRamp)}
            >
              <div className="checkbox-custom-sq">
                {includesAdaRamp && <Check size={14} strokeWidth={3} />}
              </div>
              <div className="checkbox-label-text">
                Does area of repair include ADA sidewalk ramp
              </div>
            </div>

            {/* Form Error Notice */}
            {formError && (
              <div
                style={{
                  color: 'var(--red-dark)',
                  background: 'var(--red-subtle)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  marginBottom: '16px',
                }}
              >
                {formError}
              </div>
            )}

            {/* Solid Navy Save Button matching Reference Image 2 */}
            <button
              type="submit"
              className="btn-citizen-save"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? 'Submitting Request...' : 'Save'}
            </button>
          </form>

          {/* Quick Academic Test Presets Bar for Professor Verification */}
          <div className="test-presets-bar">
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
              Quick Test Presets:
            </span>
            <button
              type="button"
              className="preset-chip"
              onClick={() => loadPreset('pothole')}
            >
              Nid-de-poule (PASS)
            </button>
            <button
              type="button"
              className="preset-chip"
              onClick={() => loadPreset('mismatch')}
            >
              Incohérence (REVIEW)
            </button>
            <button
              type="button"
              className="preset-chip"
              onClick={() => loadPreset('reject')}
            >
              Sans Média (REJECT)
            </button>
            <button
              type="button"
              className="preset-chip"
              onClick={() => loadPreset('outage')}
            >
              Panne RAG (REVIEW)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
