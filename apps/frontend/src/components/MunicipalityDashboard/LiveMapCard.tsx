import React, { useState, useMemo, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { TicketDemo } from '../../services/api';

interface LiveMapCardProps {
  tickets: TicketDemo[];
  onSelectTicket?: (ticket: TicketDemo) => void;
  onViewFullMap?: () => void;
  selectedTicketId?: string | null;
}

/**
 * Helper to determine marker color and status category
 */
const getMarkerColor = (status: string): { color: string; label: string; group: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'UNASSIGNED' } => {
  const s = status.toUpperCase();
  if (s === 'RESOLVED' || s === 'CLOSED') {
    return { color: '#10b981', label: 'Resolved', group: 'RESOLVED' };
  }
  if (s === 'IN_PROGRESS' || s === 'ASSIGNED') {
    return { color: '#f97316', label: 'In Progress', group: 'IN_PROGRESS' };
  }
  if (s === 'REVIEW_REQUIRED' || s === 'VALIDATING' || s === 'ANALYZING' || s === 'UNASSIGNED') {
    return { color: '#8b5cf6', label: 'Unassigned', group: 'UNASSIGNED' };
  }
  return { color: '#ef4444', label: 'Open', group: 'OPEN' };
};

/**
 * Creates custom crisp HTML pins with colored markers matching Reference Image 1
 */
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

/**
 * Map helper to auto-fit bounds and handle resize
 */
const MapController: React.FC<{
  bounds: L.LatLngBounds | null;
  center?: [number, number] | null;
  triggerFit: number;
}> = ({ bounds, center, triggerFit }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate size on mount to avoid partial tile rendering
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'UNASSIGNED'>('ALL');
  const [fitTrigger, setFitTrigger] = useState(0);

  // 1. Filter out records that lack valid geographic coordinates
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

  // 2. Compute accurate counts for legend matching Reference Image 1
  const counts = useMemo(() => {
    let open = 0;
    let inProgress = 0;
    let resolved = 0;
    let unassigned = 0;

    for (const t of geocodedTickets) {
      const { group } = getMarkerColor(t.status);
      if (group === 'OPEN') open++;
      else if (group === 'IN_PROGRESS') inProgress++;
      else if (group === 'RESOLVED') resolved++;
      else if (group === 'UNASSIGNED') unassigned++;
    }

    return { open, inProgress, resolved, unassigned, total: geocodedTickets.length };
  }, [geocodedTickets]);

  // 3. Filter displayed markers according to active filter
  const displayedTickets = useMemo(() => {
    if (statusFilter === 'ALL') return geocodedTickets;
    return geocodedTickets.filter((t) => {
      const { group } = getMarkerColor(t.status);
      return group === statusFilter;
    });
  }, [geocodedTickets, statusFilter]);

  // 4. Compute geographic bounds for auto-fitting
  const bounds = useMemo(() => {
    if (displayedTickets.length === 0) return null;
    const latLngs = displayedTickets.map(
      (t) => [t.location!.latitude!, t.location!.longitude!] as [number, number]
    );
    return L.latLngBounds(latLngs);
  }, [displayedTickets]);

  // 5. Selected ticket center coordinate if focused
  const focusedCenter = useMemo(() => {
    if (!selectedTicketId) return null;
    const found = geocodedTickets.find((t) => t.ticket_id === selectedTicketId);
    if (found?.location?.latitude && found?.location?.longitude) {
      return [found.location.latitude, found.location.longitude] as [number, number];
    }
    return null;
  }, [selectedTicketId, geocodedTickets]);

  // Default fallback center (Tunis center) if no bounds
  const defaultCenter: [number, number] = [36.8008, 10.18];

  return (
    <div className="dashboard-panel-card live-map-card-wrapper">
      {/* Header matching Reference Image 1 */}
      <div className="panel-header-row">
        <div className="panel-header-title">
          <span>Live map</span>
          <span className="live-map-geocoded-badge" title="Total PostgreSQL records with valid GPS coordinates">
            {counts.total} geolocated
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="map-action-pill-btn"
            onClick={() => setFitTrigger((prev) => prev + 1)}
            title="Recenter and fit all geolocated incidents"
          >
            <Crosshair size={13} />
            <span>Fit</span>
          </button>
          <span
            className="panel-header-link"
            onClick={onViewFullMap}
            role="button"
            tabIndex={0}
            title="Open full interactive geographic map"
          >
            View full map
          </span>
        </div>
      </div>

      {/* Real Geographic Map Canvas */}
      <div className="real-map-canvas-container">
        {geocodedTickets.length === 0 ? (
          <div className="map-empty-state">
            <Compass size={32} className="map-empty-icon" />
            <div className="map-empty-title">No Geolocated Incidents</div>
            <div className="map-empty-text">
              None of the current tickets in PostgreSQL contain valid geographic coordinates.
            </div>
          </div>
        ) : (
          <MapContainer
            center={bounds?.getCenter() || defaultCenter}
            zoom={12}
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
                        {ticket.procedure || 'Standard municipal triage procedure.'}
                      </div>

                      <div className="map-popup-footer">
                        <span className="map-popup-priority">
                          Priority: <strong>{ticket.priority}</strong>
                        </span>
                        {onSelectTicket && (
                          <button
                            type="button"
                            className="map-popup-inspect-btn"
                            onClick={() => onSelectTicket(ticket)}
                          >
                            <span>Inspect</span>
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

      {/* Accurate Status Legend matching Reference Image 1 proportions */}
      <div className="map-legend-row">
        <div
          className={`legend-item ${statusFilter === 'OPEN' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter((prev) => (prev === 'OPEN' ? 'ALL' : 'OPEN'))}
          title="Click to filter Open incidents"
        >
          <span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span>
          <span>{counts.open} Open</span>
        </div>

        <div
          className={`legend-item ${statusFilter === 'IN_PROGRESS' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter((prev) => (prev === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS'))}
          title="Click to filter In Progress incidents"
        >
          <span className="legend-dot" style={{ backgroundColor: '#f97316' }}></span>
          <span>{counts.inProgress} In progress</span>
        </div>

        <div
          className={`legend-item ${statusFilter === 'UNASSIGNED' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter((prev) => (prev === 'UNASSIGNED' ? 'ALL' : 'UNASSIGNED'))}
          title="Click to filter Unassigned incidents"
        >
          <span className="legend-dot" style={{ backgroundColor: '#8b5cf6' }}></span>
          <span>{counts.unassigned} Unassigned</span>
        </div>

        <div
          className={`legend-item ${statusFilter === 'RESOLVED' ? 'active-filter' : ''}`}
          onClick={() => setStatusFilter((prev) => (prev === 'RESOLVED' ? 'ALL' : 'RESOLVED'))}
          title="Click to filter Resolved incidents"
        >
          <span className="legend-dot" style={{ backgroundColor: '#10b981' }}></span>
          <span>{counts.resolved} Resolved</span>
        </div>
      </div>

      {/* Data Provenance & Exclusion Disclosure */}
      <div className="map-exclusion-note">
        <span>
          Real PostgreSQL 14 coordinates ({counts.total} mapped
          {excludedCount > 0 ? ` • ${excludedCount} non-geolocated excluded` : ''})
        </span>
      </div>
    </div>
  );
};
