import React, { useState, useMemo, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  X,
  Crosshair,
  Search,
  Filter,
  MapPin,
  ExternalLink,
  Layers,
  AlertCircle,
  Clock,
  Compass,
  Building2,
} from 'lucide-react';
import { TicketDemo } from '../../services/api';

interface FullMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: TicketDemo[];
  onSelectTicket: (ticket: TicketDemo) => void;
  initialSelectedTicketId?: string | null;
}

const getMarkerColor = (status: string): { color: string; label: string; group: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'UNASSIGNED' } => {
  const s = status.toUpperCase();
  if (s === 'RESOLVED' || s === 'CLOSED') {
    return { color: '#10b981', label: 'Résolu', group: 'RESOLVED' };
  }
  if (s === 'IN_PROGRESS' || s === 'ASSIGNED') {
    return { color: '#f97316', label: 'En cours', group: 'IN_PROGRESS' };
  }
  if (s === 'REVIEW_REQUIRED' || s === 'VALIDATING' || s === 'ANALYZING' || s === 'UNASSIGNED') {
    return { color: '#8b5cf6', label: 'Non assigné', group: 'UNASSIGNED' };
  }
  return { color: '#ef4444', label: 'Ouvert', group: 'OPEN' };
};

const createCustomPinIcon = (color: string, isSelected: boolean = false) => {
  return L.divIcon({
    className: 'custom-leaflet-marker-div',
    html: `
      <div class="leaflet-pin-wrapper ${isSelected ? 'selected' : ''}" style="--pin-color: ${color}; width: 30px; height: 38px;">
        <div class="leaflet-pin-circle" style="background-color: ${color}; width: 30px; height: 30px;">
          <div class="leaflet-pin-dot" style="width: 10px; height: 10px;"></div>
        </div>
        <div class="leaflet-pin-arrow" style="border-top-color: ${color}; border-top-width: 9px;"></div>
      </div>
    `,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -36],
  });
};

const MapController: React.FC<{
  bounds: L.LatLngBounds | null;
  center?: [number, number] | null;
  triggerFit: number;
}> = ({ bounds, center, triggerFit }) => {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 1.2 });
    } else if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [map, bounds, center, triggerFit]);

  return null;
};

export const FullMapModal: React.FC<FullMapModalProps> = ({
  isOpen,
  onClose,
  tickets,
  onSelectTicket,
  initialSelectedTicketId,
}) => {
  const [cityFilter, setCityFilter] = useState<'TUNIS' | 'CASABLANCA' | 'ALL'>('TUNIS');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(initialSelectedTicketId || null);
  const [fitTrigger, setFitTrigger] = useState(0);

  useEffect(() => {
    if (initialSelectedTicketId) {
      setActiveTicketId(initialSelectedTicketId);
    }
  }, [initialSelectedTicketId]);

  // 1. Filter out tickets without valid coordinates
  const validTickets = useMemo(() => {
    return tickets.filter((t) => {
      const lat = t.location?.latitude;
      const lon = t.location?.longitude;
      return (
        lat !== null &&
        lat !== undefined &&
        lon !== null &&
        lon !== undefined &&
        !isNaN(lat) &&
        !isNaN(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
      );
    });
  }, [tickets]);

  // 2. City Filter (Tunis vs Casablanca) per Requirement 6
  const cityTickets = useMemo(() => {
    if (cityFilter === 'ALL') return validTickets;
    if (cityFilter === 'TUNIS') {
      return validTickets.filter((t) => (t.location?.latitude || 0) >= 35);
    }
    return validTickets.filter((t) => (t.location?.latitude || 0) < 35);
  }, [validTickets, cityFilter]);

  // 3. Multi-factor search & filtering
  const filteredTickets = useMemo(() => {
    return cityTickets.filter((t) => {
      if (statusFilter !== 'ALL') {
        const { group } = getMarkerColor(t.status);
        if (group !== statusFilter) return false;
      }

      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) {
        return false;
      }

      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const idMatch = t.ticket_id.toLowerCase().includes(term);
        const addrMatch = t.location?.address?.toLowerCase().includes(term);
        const catMatch = t.category.toLowerCase().includes(term);
        if (!idMatch && !addrMatch && !catMatch) return false;
      }

      return true;
    });
  }, [cityTickets, statusFilter, categoryFilter, priorityFilter, searchTerm]);

  // 4. Compute bounds
  const bounds = useMemo(() => {
    if (filteredTickets.length === 0) return null;
    const latLngs = filteredTickets.map(
      (t) => [t.location!.latitude!, t.location!.longitude!] as [number, number]
    );
    return L.latLngBounds(latLngs);
  }, [filteredTickets]);

  const focusedCenter = useMemo(() => {
    if (!activeTicketId) return null;
    const found = validTickets.find((t) => t.ticket_id === activeTicketId);
    if (found?.location?.latitude && found?.location?.longitude) {
      return [found.location.latitude, found.location.longitude] as [number, number];
    }
    return null;
  }, [activeTicketId, validTickets]);

  if (!isOpen) return null;

  const defaultCenter: [number, number] =
    cityFilter === 'CASABLANCA' ? [33.5731, -7.5898] : [36.8008, 10.18];

  return (
    <div className="full-map-modal-backdrop" onClick={onClose}>
      <div className="full-map-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="full-map-top-bar">
          <div className="full-map-title-group">
            <h2 className="full-map-title">Carte Interactive des Incidents Municipaux</h2>
            <span className="full-map-badge">
              {filteredTickets.length} incidents affichés sur OpenStreetMap
            </span>
          </div>

          <div className="full-map-top-actions">
            {/* City Selector */}
            <select
              value={cityFilter}
              onChange={(e: any) => {
                setCityFilter(e.target.value);
                setFitTrigger((p) => p + 1);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '13px',
                fontWeight: 600,
                background: '#ffffff',
              }}
            >
              <option value="TUNIS">Grand Tunis ({validTickets.filter(t => (t.location?.latitude || 0) >= 35).length})</option>
              <option value="CASABLANCA">Casablanca ({validTickets.filter(t => (t.location?.latitude || 0) < 35).length})</option>
              <option value="ALL">Toutes les villes ({validTickets.length})</option>
            </select>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setFitTrigger((prev) => prev + 1)}
              title="Centrer la carte sur tous les incidents affichés"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Crosshair size={14} />
              <span>Centrer</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              title="Fermer la vue cartographique"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="full-map-filter-bar">
          <div className="full-map-search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par identifiant, rue ou catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="full-map-search-input"
            />
          </div>

          <div className="full-map-filters-row">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="full-map-select"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="OPEN">Ouvert</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="UNASSIGNED">Non assigné</option>
              <option value="RESOLVED">Résolu</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="full-map-select"
            >
              <option value="ALL">Toutes catégories</option>
              <option value="ROAD_DAMAGE">Voirie & Chaussée</option>
              <option value="STREET_LIGHTING">Éclairage Public</option>
              <option value="WASTE">Propreté & Déchets</option>
              <option value="WATER_LEAK">Réseau d’Eau</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="full-map-select"
            >
              <option value="ALL">Toutes priorités</option>
              <option value="HIGH">Haute</option>
              <option value="NORMAL">Normale</option>
              <option value="LOW">Basse</option>
            </select>
          </div>
        </div>

        {/* Leaflet Canvas Area */}
        <div className="full-map-body-container">
          <MapContainer
            center={bounds?.getCenter() || defaultCenter}
            zoom={cityFilter === 'ALL' ? 6 : 13}
            scrollWheelZoom={true}
            className="full-leaflet-map-element"
            attributionControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <MapController
              bounds={bounds}
              center={focusedCenter}
              triggerFit={fitTrigger}
            />

            {filteredTickets.map((ticket) => {
              const lat = ticket.location!.latitude!;
              const lon = ticket.location!.longitude!;
              const { color } = getMarkerColor(ticket.status);
              const isSelected = ticket.ticket_id === activeTicketId;

              return (
                <Marker
                  key={ticket.ticket_id}
                  position={[lat, lon]}
                  icon={createCustomPinIcon(color, isSelected)}
                  eventHandlers={{
                    click: () => setActiveTicketId(ticket.ticket_id),
                  }}
                >
                  <Popup className="fixly-leaflet-popup">
                    <div className="map-popup-card">
                      <div className="map-popup-header">
                        <span className="map-popup-id">{ticket.ticket_id}</span>
                        <span
                          className="map-popup-status"
                          style={{
                            backgroundColor: `${color}18`,
                            color: color,
                            borderColor: `${color}40`,
                          }}
                        >
                          {ticket.status}
                        </span>
                      </div>

                      <div className="map-popup-category">
                        {ticket.category.replace('_', ' ')}
                      </div>

                      <div className="map-popup-address">
                        <MapPin size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{ticket.location?.address || `${lat.toFixed(4)}, ${lon.toFixed(4)}`}</span>
                      </div>

                      <div className="map-popup-procedure">
                        {ticket.procedure || 'Procédure standard de voirie municipale.'}
                      </div>

                      <div className="map-popup-footer">
                        <span className="map-popup-priority">
                          Priorité : <strong>{ticket.priority === 'HIGH' ? 'Haute' : ticket.priority === 'NORMAL' ? 'Normale' : 'Basse'}</strong>
                        </span>
                        <button
                          type="button"
                          className="map-popup-inspect-btn"
                          onClick={() => {
                            onClose();
                            onSelectTicket(ticket);
                          }}
                        >
                          <span>Fiche détaillée</span>
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Floating Sidebar List */}
          <div className="full-map-sidebar-list">
            <div className="full-map-sidebar-header">
              <span>Incidents géolocalisés ({filteredTickets.length})</span>
            </div>
            <div className="full-map-sidebar-items">
              {filteredTickets.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Aucun incident ne correspond aux filtres.
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const { color, label } = getMarkerColor(t.status);
                  const isSelected = t.ticket_id === activeTicketId;

                  return (
                    <div
                      key={t.ticket_id}
                      className={`map-sidebar-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setActiveTicketId(t.ticket_id)}
                    >
                      <div className="map-sidebar-item-top">
                        <span className="map-sidebar-ticket-id">{t.ticket_id}</span>
                        <span
                          className="map-sidebar-status-tag"
                          style={{
                            backgroundColor: `${color}18`,
                            color: color,
                          }}
                        >
                          {label}
                        </span>
                      </div>
                      <div className="map-sidebar-item-desc">
                        {t.location?.address || 'Tunis'}
                      </div>
                      <div className="map-sidebar-item-footer">
                        <span>{t.category.replace('_', ' ')}</span>
                        <button
                          type="button"
                          className="map-sidebar-btn-inspect"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            onSelectTicket(t);
                          }}
                        >
                          Examiner
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
