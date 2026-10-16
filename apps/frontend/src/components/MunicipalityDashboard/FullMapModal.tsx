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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(initialSelectedTicketId || null);
  const [fitTrigger, setFitTrigger] = useState(0);

  // Keyboard shortcut: Escape closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract geocoded records from PostgreSQL
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

  // Filter based on criteria
  const filteredTickets = useMemo(() => {
    return geocodedTickets.filter((t) => {
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
        const q = searchTerm.toLowerCase();
        const idMatch = t.ticket_id.toLowerCase().includes(q);
        const addrMatch = t.location?.address?.toLowerCase().includes(q);
        const descMatch = t.procedure?.toLowerCase().includes(q);
        if (!idMatch && !addrMatch && !descMatch) return false;
      }
      return true;
    });
  }, [geocodedTickets, statusFilter, categoryFilter, priorityFilter, searchTerm]);

  // Compute bounding box
  const bounds = useMemo(() => {
    if (filteredTickets.length === 0) return null;
    const latLngs = filteredTickets.map(
      (t) => [t.location!.latitude!, t.location!.longitude!] as [number, number]
    );
    return L.latLngBounds(latLngs);
  }, [filteredTickets]);

  // Target coordinates when an incident is clicked in the side list
  const activeCenter = useMemo(() => {
    if (!activeTicketId) return null;
    const found = geocodedTickets.find((t) => t.ticket_id === activeTicketId);
    if (found?.location?.latitude && found?.location?.longitude) {
      return [found.location.latitude, found.location.longitude] as [number, number];
    }
    return null;
  }, [activeTicketId, geocodedTickets]);

  if (!isOpen) return null;

  return (
    <div className="full-map-modal-overlay">
      <div className="full-map-modal-container">
        {/* Modal Header */}
        <div className="full-map-header">
          <div className="full-map-header-left">
            <div className="full-map-icon-box">
              <Compass size={20} />
            </div>
            <div>
              <h2 className="full-map-title">Smart City Geographic Operations Map</h2>
              <div className="full-map-subtitle">
                <span>{geocodedTickets.length} mapped incidents from PostgreSQL 14</span>
                {excludedCount > 0 && <span> • {excludedCount} without GPS excluded</span>}
              </div>
            </div>
          </div>

          <div className="full-map-header-right">
            <button
              type="button"
              className="full-map-fit-btn"
              onClick={() => {
                setActiveTicketId(null);
                setFitTrigger((p) => p + 1);
              }}
              title="Fit map to visible incidents"
            >
              <Crosshair size={14} />
              <span>Fit bounds</span>
            </button>
            <button
              type="button"
              className="full-map-close-btn"
              onClick={onClose}
              title="Close full map view"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="full-map-toolbar">
          <div className="full-map-search-wrap">
            <Search size={14} className="full-map-search-icon" />
            <input
              type="text"
              placeholder="Search by ticket ID, address, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="full-map-search-input"
            />
          </div>

          <div className="full-map-filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="full-map-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">🔴 Open</option>
              <option value="IN_PROGRESS">🟠 In Progress</option>
              <option value="UNASSIGNED">🟣 Unassigned / Review</option>
              <option value="RESOLVED">🟢 Resolved</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="full-map-select"
            >
              <option value="ALL">All Categories</option>
              <option value="ROAD_DAMAGE">Road Damage</option>
              <option value="STREET_LIGHTING">Street Lighting</option>
              <option value="WASTE">Sanitation & Waste</option>
              <option value="WATER_LEAK">Water & Utilities</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="full-map-select"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Medium / Normal</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Main Body: Sidebar + Large Leaflet Map */}
        <div className="full-map-body">
          {/* Side List of Incidents */}
          <div className="full-map-sidebar">
            <div className="full-map-sidebar-header">
              <span>Incidents ({filteredTickets.length})</span>
            </div>
            <div className="full-map-sidebar-list">
              {filteredTickets.length === 0 ? (
                <div className="full-map-no-results">
                  No matching geolocated incidents found.
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const { color, label } = getMarkerColor(ticket.status);
                  const isSelected = ticket.ticket_id === activeTicketId;

                  return (
                    <div
                      key={ticket.ticket_id}
                      className={`full-map-incident-item ${isSelected ? 'active' : ''}`}
                      onClick={() => setActiveTicketId(ticket.ticket_id)}
                    >
                      <div className="full-map-item-top">
                        <span className="full-map-item-id">{ticket.ticket_id}</span>
                        <span
                          className="full-map-item-status"
                          style={{
                            backgroundColor: `${color}18`,
                            color: color,
                            borderColor: `${color}40`,
                          }}
                        >
                          {label}
                        </span>
                      </div>
                      <div className="full-map-item-category">
                        {ticket.category.replace('_', ' ')}
                      </div>
                      <div className="full-map-item-address">
                        <MapPin size={11} style={{ flexShrink: 0 }} />
                        <span>{ticket.location?.address || 'No address specified'}</span>
                      </div>
                      <div className="full-map-item-actions">
                        <span className="full-map-item-priority">
                          Priority: {ticket.priority}
                        </span>
                        <button
                          type="button"
                          className="full-map-item-inspect-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTicket(ticket);
                          }}
                        >
                          <span>Open Ticket</span>
                          <ExternalLink size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Leaflet Map Container */}
          <div className="full-map-canvas">
            <MapContainer
              center={bounds?.getCenter() || [36.8008, 10.18]}
              zoom={13}
              scrollWheelZoom={true}
              className="full-leaflet-element"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />

              <MapController
                bounds={bounds}
                center={activeCenter}
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
                          {ticket.procedure || 'Standard municipal triage procedure.'}
                        </div>

                        <div className="map-popup-footer">
                          <span className="map-popup-priority">
                            Priority: <strong>{ticket.priority}</strong>
                          </span>
                          <button
                            type="button"
                            className="map-popup-inspect-btn"
                            onClick={() => onSelectTicket(ticket)}
                          >
                            <span>Inspect Ticket</span>
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
