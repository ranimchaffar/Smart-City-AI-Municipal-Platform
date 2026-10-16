import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Minus,
  Crosshair,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react';
import { TicketDemo } from '../../services/api';

interface LiveMapCardProps {
  tickets: TicketDemo[];
  onSelectTicket?: (ticket: TicketDemo) => void;
  onViewFullMap?: () => void;
}

export const LiveMapCard: React.FC<LiveMapCardProps> = ({
  tickets,
  onSelectTicket,
  onViewFullMap,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  // Styled pins positions across city districts matching Reference Image 1
  const mapPins = [
    { id: 'pin-1', top: '35%', left: '26%', color: '#ef4444', status: 'OPEN', label: 'Oakwide Pothole' },
    { id: 'pin-2', top: '56%', left: '32%', color: '#f97316', status: 'IN_PROGRESS', label: 'Riverview Lighting' },
    { id: 'pin-3', top: '48%', left: '54%', color: '#ef4444', status: 'OPEN', label: 'Downtown Water' },
    { id: 'pin-4', top: '30%', left: '68%', color: '#10b981', status: 'RESOLVED', label: 'Central Dist. Clean' },
    { id: 'pin-5', top: '68%', left: '74%', color: '#ef4444', status: 'OPEN', label: 'East Hwy Damage' },
    { id: 'pin-6', top: '62%', left: '86%', color: '#8b5cf6', status: 'UNASSIGNED', label: 'Oakwood Waste' },
  ];

  return (
    <div className="dashboard-panel-card">
      <div className="panel-header-row">
        <div className="panel-header-title">
          <span>Live map</span>
        </div>
        <span className="panel-header-link" onClick={onViewFullMap}>
          View full map
        </span>
      </div>

      {/* Styled Map Container matching Reference Image 1 */}
      <div className="map-canvas-container">
        {/* SVG City Map with River and Parks */}
        <svg
          className="map-svg-background"
          viewBox="0 0 500 300"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base terrain */}
          <rect width="500" height="300" fill="#f8fafc" />

          {/* City Grid Lines (Streets) */}
          <g stroke="#e2e8f0" strokeWidth="1.5">
            <line x1="0" y1="50" x2="500" y2="50" />
            <line x1="0" y1="100" x2="500" y2="100" />
            <line x1="0" y1="150" x2="500" y2="150" />
            <line x1="0" y1="200" x2="500" y2="200" />
            <line x1="0" y1="250" x2="500" y2="250" />

            <line x1="60" y1="0" x2="60" y2="300" />
            <line x1="130" y1="0" x2="130" y2="300" />
            <line x1="200" y1="0" x2="200" y2="300" />
            <line x1="280" y1="0" x2="280" y2="300" />
            <line x1="360" y1="0" x2="360" y2="300" />
            <line x1="430" y1="0" x2="430" y2="300" />
          </g>

          {/* Major Avenues (Yellowish roads) */}
          <g stroke="#fef08a" strokeWidth="3" opacity="0.8">
            <line x1="0" y1="120" x2="500" y2="120" />
            <line x1="220" y1="0" x2="220" y2="300" />
            <line x1="40" y1="240" x2="460" y2="40" />
          </g>

          {/* Blue Curved River */}
          <path
            d="M 330 0 C 340 70, 370 120, 420 180 C 470 240, 480 300, 490 300"
            fill="none"
            stroke="#93c5fd"
            strokeWidth="32"
            opacity="0.85"
            strokeLinecap="round"
          />

          {/* Parks (Green zones) */}
          {/* Lakeside Park */}
          <path
            d="M 120 220 C 140 210, 180 215, 190 240 C 200 270, 150 290, 120 280 Z"
            fill="#dcfce7"
            opacity="0.9"
          />
          {/* Oakwood Park */}
          <rect x="420" y="160" width="70" height="90" rx="10" fill="#dcfce7" opacity="0.9" />

          {/* District Labels matching Reference Image 1 */}
          <text x="30" y="35" fill="#64748b" fontSize="11" fontWeight="600">Riverview</text>
          <text x="50" y="90" fill="#64748b" fontSize="11" fontWeight="600">Oakwide</text>
          <text x="240" y="95" fill="#334155" fontSize="11" fontWeight="700">Downtown</text>
          <text x="230" y="145" fill="#475569" fontSize="11" fontWeight="600">Central District</text>
          <text x="135" y="245" fill="#15803d" fontSize="10" fontWeight="600">Lakeside</text>
          <text x="140" y="258" fill="#15803d" fontSize="10" fontWeight="600">Park</text>
          <text x="425" y="200" fill="#15803d" fontSize="10" fontWeight="600">Oakwood Park</text>
        </svg>

        {/* Map Pins matching Reference Image 1 */}
        {mapPins.map((pin) => (
          <div
            key={pin.id}
            className="map-pin"
            style={{
              top: pin.top,
              left: pin.left,
              background: pin.color,
            }}
            title={`${pin.label} (${pin.status})`}
            onClick={() => {
              if (tickets.length > 0 && onSelectTicket) {
                onSelectTicket(tickets[0]);
              }
            }}
          >
            <MapPin size={12} strokeWidth={2.5} />
          </div>
        ))}

        {/* Zoom & Navigation Controls */}
        <div className="map-controls-group">
          <button
            type="button"
            className="map-ctrl-btn"
            onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2))}
            title="Zoom in"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            className="map-ctrl-btn"
            onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
            title="Zoom out"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            className="map-ctrl-btn"
            onClick={() => setZoomLevel(1)}
            title="Center map"
          >
            <Crosshair size={13} />
          </button>
        </div>
      </div>

      {/* Legend Row matching Reference Image 1 */}
      <div className="map-legend-row">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#ef4444' }} />
          <span>5 Open</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#f97316' }} />
          <span>3 In progress</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#8b5cf6' }} />
          <span>2 Unassigned</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#10b981' }} />
          <span>14 Resolved</span>
        </div>
      </div>
    </div>
  );
};
