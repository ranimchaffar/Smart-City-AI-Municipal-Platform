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
  Maximize2,
  Crosshair,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  MapPin,
  ExternalLink,
  Layers,
  Building2,
} from 'lucide-react';
import { TicketDemo } from '../../services/api';

interface LiveMapCardProps {
  tickets: TicketDemo[];
  onSelectTicket?: (ticket: TicketDemo) => void;
  onViewFullMap?: () => void;
  selectedTicketId?: string | null;
}

/**
 * Marker styling and French status groupings
 */
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
      <div class="leaflet-pin-wrapper ${isSelected ? 'selected' : ''}" style="--pin-color: ${color};">
        <div class="leaflet-pin-circle" style="background-color: ${color};">
          <div class="leaflet-pin-dot"></div>
        </div>
        <div class="leaflet-pin-arrow" style="border-top-color: ${color};"></div>
      </div>
    `,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -32],
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
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1.2 });
    } else if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
    }
  }, [map, bounds, center, triggerFit]);

  return null;
};

export const LiveMapCard: React.FC<LiveMapCardProps> = ({
  tickets,
  onSelectTicket,
  onViewFullMap,
  selectedTicketId,
}) => {
  const [cityFilter, setCityFilter] = useState<'TUNIS' | 'CASABLANCA' | 'ALL'>('TUNIS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'UNASSIGNED'>('ALL');
  const [fitTrigger, setFitTrigger] = useState(0);

  // 1. Filter out records without valid coordinates
  const { geocodedTickets, excludedCount } = useMemo(() => {
    let excluded = 0;
    const valid: TicketDemo[] = [];

    for (const t of tickets) {
      const lat = t.location?.latitude;
      const lon = t.location?.longitude;

      if (
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
      ) {
        valid.push(t);
      } else {
        excluded++;
      }
    }

    return { geocodedTickets: valid, excludedCount: excluded };
  }, [tickets]);

  // 2. Filter by geographic city (Tunis vs Casablanca) per Requirement 6
  const cityFilteredTickets = useMemo(() => {
    if (cityFilter === 'ALL') return geocodedTickets;
    if (cityFilter === 'TUNIS') {
      return geocodedTickets.filter((t) => (t.location?.latitude || 0) >= 35);
    }
    // Casablanca: latitude < 35 (approx 33.59)
    return geocodedTickets.filter((t) => (t.location?.latitude || 0) < 35);
  }, [geocodedTickets, cityFilter]);

  // 3. Compute accurate counts for legend
  const counts = useMemo(() => {
    let open = 0;
    let inProgress = 0;
    let resolved = 0;
    let unassigned = 0;

    for (const t of cityFilteredTickets) {
      const { group } = getMarkerColor(t.status);
      if (group === 'OPEN') open++;
      else if (group === 'IN_PROGRESS') inProgress++;
      else if (group === 'RESOLVED') resolved++;
      else if (group === 'UNASSIGNED') unassigned++;
    }

    return { open, inProgress, resolved, unassigned, total: cityFilteredTickets.length };
  }, [cityFilteredTickets]);

  // 4. Filter displayed markers according to status filter
  const displayedTickets = useMemo(() => {
    if (statusFilter === 'ALL') return cityFilteredTickets;
    return cityFilteredTickets.filter((t) => {
      const { group } = getMarkerColor(t.status);
      return group === statusFilter;
    });
  }, [cityFilteredTickets, statusFilter]);

  // 5. Geographic bounds for auto-fitting
  const bounds = useMemo(() => {
    if (displayedTickets.length === 0) return null;
    const latLngs = displayedTickets.map(
      (t) => [t.location!.latitude!, t.location!.longitude!] as [number, number]
    );
    return L.latLngBounds(latLngs);
  }, [displayedTickets]);

  // 6. Selected ticket focus
  const focusedCenter = useMemo(() => {
    if (!selectedTicketId) return null;
    const found = displayedTickets.find((t) => t.ticket_id === selectedTicketId);
    if (found?.location?.latitude && found?.location?.longitude) {
      return [found.location.latitude, found.location.longitude] as [number, number];
    }
    return null;
  }, [selectedTicketId, displayedTickets]);

  const defaultCenter: [number, number] =
    cityFilter === 'CASABLANCA' ? [33.5731, -7.5898] : [36.8008, 10.18];

  return (
    <div className="dashboard-panel-card live-map-card-wrapper">
      {/* Top Header */}
      <div className="panel-header-row">
        <div className="panel-header-title">
          <span>Carte des incidents en direct</span>
          <span className="live-map-geocoded-badge" title="Total d'incidents réels avec coordonnées GPS valides">
            {counts.total} géolocalisés
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* City Geographic Selector (Requirement 6) */}
          <select
            value={cityFilter}
            onChange={(e: any) => {
              setCityFilter(e.target.value);
              setFitTrigger((p) => p + 1);
            }}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '12px',
              background: '#ffffff',
              fontWeight: 600,
              color: 'var(--text-main)',
            }}
            title="Filtrer par territoire urbain"
          >
            <option value="TUNIS">Grand Tunis ({geocodedTickets.filter(t => (t.location?.latitude || 0) >= 35).length})</option>
            <option value="CASABLANCA">Casablanca ({geocodedTickets.filter(t => (t.location?.latitude || 0) < 35).length})</option>
            <option value="ALL">Toutes les villes ({geocodedTickets.length})</option>
          </select>

          <button
            type="button"
            className="map-action-pill-btn"
            onClick={() => setFitTrigger((prev) => prev + 1)}
            title="Recadrer et centrer la carte sur les incidents"
          >
            <Crosshair size={13} />
            <span>Centrer</span>
          </button>

          <span
            className="panel-header-link"
            onClick={onViewFullMap}
            role="button"
            tabIndex={0}
            title="Ouvrir la carte interactive plein écran"
            style={{ cursor: 'pointer' }}
          >
            Agrandir la carte
          </span>
        </div>
      </div>

      {/* Real Geographic Map Canvas */}
      <div className="real-map-canvas-container">
        {cityFilteredTickets.length === 0 ? (
          <div className="map-empty-state">
            <Compass size={32} className="map-empty-icon" />
            <div className="map-empty-title">Aucun incident géolocalisé</div>
            <div className="map-empty-text">
              Aucun incident ne correspond aux critères géographiques sélectionnés.
            </div>
          </div>
        ) : (
          <MapContainer
            center={bounds?.getCenter() || defaultCenter}
            zoom={cityFilter === 'ALL' ? 6 : 12}
            scrollWheelZoom={true}
            className="leaflet-map-element"
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

            {displayedTickets.map((ticket) => {
              const lat = ticket.location!.latitude!;
              const lon = ticket.location!.longitude!;
              const { color } = getMarkerColor(ticket.status);
              const isSelected = ticket.ticket_id === selectedTicketId;

              return (
                <Marker
                  key={ticket.ticket_id}
                  position={[lat, lon]}
                  icon={createCustomPinIcon(color, isSelected)}
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
                        {onSelectTicket && (
                          <button
                            type="button"
                            className="map-popup-inspect-btn"
                            onClick={() => onSelectTicket(ticket)}
                          >
                            <span>Examiner</span>
                            <ExternalLink size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Status Legend */}
      <div className="map-legend-row">
        <div
          className={`legend-item ${statusFilter === 'OPEN' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter((prev) => (prev === 'OPEN' ? 'ALL' : 'OPEN'))}
          title="Filtrer les incidents ouverts"
        >
          <span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span>
          <span>{counts.open} Ouverts</span>
        </div>

        <div
          className={`legend-item ${statusFilter === 'IN_PROGRESS' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter((prev) => (prev === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS'))}
          title="Filtrer les incidents en cours"
        >
          <span className="legend-dot" style={{ backgroundColor: '#f97316' }}></span>
          <span>{counts.inProgress} En cours</span>
        </div>

        <div
          className={`legend-item ${statusFilter === 'UNASSIGNED' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter((prev) => (prev === 'UNASSIGNED' ? 'ALL' : 'UNASSIGNED'))}
          title="Filtrer les incidents non assignés"
        >
          <span className="legend-dot" style={{ backgroundColor: '#8b5cf6' }}></span>
          <span>{counts.unassigned} Non assignés</span>
        </div>

        <div
          className={`legend-item ${statusFilter === 'RESOLVED' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter((prev) => (prev === 'RESOLVED' ? 'ALL' : 'RESOLVED'))}
          title="Filtrer les incidents résolus"
        >
          <span className="legend-dot" style={{ backgroundColor: '#10b981' }}></span>
          <span>{counts.resolved} Résolus</span>
        </div>
      </div>

      {/* Data Disclosure */}
      <div className="map-exclusion-note">
        <span>
          Coordonnées réelles PostgreSQL 14 ({counts.total} cartographiés sur OpenStreetMap
          {excludedCount > 0 ? ` • ${excludedCount} non géolocalisés exclus de la vue` : ''})
        </span>
      </div>
    </div>
  );
};
