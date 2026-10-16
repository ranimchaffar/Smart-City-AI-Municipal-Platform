-- Seed data for Automated Municipal Ticket System
-- Provides initial tickets across departments and categories

-- 1. Insert Initial Reports
INSERT INTO reports (report_id, description, media_ref, location_address, location_latitude, location_longitude, decision, status, demo_mode)
VALUES
('RPT-INIT-001', 'Deep pothole on Avenue Habib Bourguiba causing tire blowouts', 'mock://pothole', 'Av. Habib Bourguiba, Tunis', 36.8008, 10.1800, 'PASS', 'TICKET_CREATED', true),
('RPT-INIT-002', 'Broken streetlight flickering and causing dark alley risk', 'mock://streetlight', 'Rue de Rome, Tunis', 36.8015, 10.1820, 'PASS', 'ASSIGNED', true),
('RPT-INIT-003', 'Overflowing garbage bin near Central Market attracting strays', 'mock://waste', 'Rue d''Espagne, Central Market', 36.7970, 10.1780, 'PASS', 'IN_PROGRESS', true),
('RPT-INIT-004', 'High pressure clean water main leaking into pavement', 'mock://water_leak', 'Boulevard du 14 Janvier, Tunis', 36.8050, 10.1850, 'PASS', 'RESOLVED', true),
('RPT-INIT-005', 'Citizen reported broken street sign but image shows normal cat', 'mock://unrelated', 'Avenue de Paris', 36.8040, 10.1810, 'REVIEW', 'REVIEW_REQUIRED', true)
ON CONFLICT (report_id) DO NOTHING;

-- 2. Insert Initial Tickets
INSERT INTO tickets (ticket_id, report_id, category, severity, priority, department, status, anonymized_media_ref, location_address, location_latitude, location_longitude, procedure, sources, deadline, persisted, storage_status, is_mock)
VALUES
(
    'TKT-2026-00001',
    'RPT-INIT-001',
    'ROAD_DAMAGE',
    'HIGH',
    'HIGH',
    'ROADS_DEPARTMENT',
    'TICKET_CREATED',
    'safe/pothole_anonymized.jpg',
    'Av. Habib Bourguiba, Tunis',
    36.8008,
    10.1800,
    'Urgent asphalt patching procedure: Dispatch emergency road brigade within 24h, place hazard cones, patch with cold asphalt mix until permanent hot mix resurfacing.',
    '[{"chunk_id": "doc-roads-01", "is_mock": true, "is_official": false, "source_url": null, "search_score": 0.92, "document_title": "Tunis Municipal Road Maintenance Protocol (Demo)"}]'::jsonb,
    NOW() + INTERVAL '24 hours',
    true,
    'PERSISTED',
    true
),
(
    'TKT-2026-00002',
    'RPT-INIT-002',
    'STREET_LIGHTING',
    'MEDIUM',
    'NORMAL',
    'PUBLIC_LIGHTING_DEPARTMENT',
    'ASSIGNED',
    'safe/streetlight_anonymized.jpg',
    'Rue de Rome, Tunis',
    36.8015,
    10.1820,
    'Public lighting inspection: Inspect ballast and wiring connection, replace defective sodium-vapor bulb with LED fixture, test night sensor.',
    '[{"chunk_id": "doc-lighting-03", "is_mock": true, "is_official": false, "source_url": null, "search_score": 0.88, "document_title": "Public Lighting Quality Assurance Guidelines"}]'::jsonb,
    NOW() + INTERVAL '48 hours',
    true,
    'PERSISTED',
    true
),
(
    'TKT-2026-00003',
    'RPT-INIT-003',
    'WASTE',
    'MEDIUM',
    'NORMAL',
    'SANITATION_DEPARTMENT',
    'IN_PROGRESS',
    'safe/waste_anonymized.jpg',
    'Rue d''Espagne, Central Market',
    36.7970,
    10.1780,
    'Sanitation collection dispatch: Dispatch heavy-duty compactor truck, clean immediate surrounding pavement with pressure wash disinfectant, log volume.',
    '[{"chunk_id": "doc-sanitation-02", "is_mock": true, "is_official": false, "source_url": null, "search_score": 0.85, "document_title": "Urban Cleanliness and Waste Management Regulation"}]'::jsonb,
    NOW() + INTERVAL '12 hours',
    true,
    'PERSISTED',
    true
),
(
    'TKT-2026-00004',
    'RPT-INIT-004',
    'WATER_LEAK',
    'HIGH',
    'HIGH',
    'WATER_SERVICES_DEPARTMENT',
    'RESOLVED',
    'safe/water_leak_anonymized.jpg',
    'Boulevard du 14 Janvier, Tunis',
    36.8050,
    10.1850,
    'Drinking water network intervention: Shut off isolation valve V-12, excavate pipe segment, install stainless steel repair clamp, restore water pressure and test water clarity.',
    '[{"chunk_id": "doc-water-04", "is_mock": true, "is_official": false, "source_url": null, "search_score": 0.95, "document_title": "Emergency Potable Water Repair Standards"}]'::jsonb,
    NOW() - INTERVAL '2 hours',
    true,
    'PERSISTED',
    true
)
ON CONFLICT (ticket_id) DO NOTHING;

-- 3. Insert Initial Ticket Events
INSERT INTO ticket_events (ticket_id, from_status, to_status, actor, notes)
VALUES
('TKT-2026-00001', NULL, 'TICKET_CREATED', 'n8n_system', 'Ticket created from citizen report RPT-INIT-001 (Gate 1, 2, 3 passed).'),
('TKT-2026-00002', NULL, 'TICKET_CREATED', 'n8n_system', 'Ticket created from citizen report RPT-INIT-002.'),
('TKT-2026-00002', 'TICKET_CREATED', 'ASSIGNED', 'supervisor_ahmed', 'Assigned to Lighting Maintenance Crew #3.'),
('TKT-2026-00003', NULL, 'TICKET_CREATED', 'n8n_system', 'Ticket created from citizen report RPT-INIT-003.'),
('TKT-2026-00003', 'TICKET_CREATED', 'ASSIGNED', 'supervisor_leila', 'Assigned to Central Market Sanitation Team.'),
('TKT-2026-00003', 'ASSIGNED', 'IN_PROGRESS', 'driver_karim', 'Compactor truck en route to location.'),
('TKT-2026-00004', NULL, 'TICKET_CREATED', 'n8n_system', 'Ticket created from citizen report RPT-INIT-004.'),
('TKT-2026-00004', 'TICKET_CREATED', 'ASSIGNED', 'dispatcher_marwa', 'Urgent water repair brigade dispatched.'),
('TKT-2026-00004', 'ASSIGNED', 'IN_PROGRESS', 'engineer_samir', 'Isolation valve closed; repair clamp applied.'),
('TKT-2026-00004', 'IN_PROGRESS', 'RESOLVED', 'engineer_samir', 'Pressure restored. Pavement made safe.');

-- 4. Insert Initial Review Case
INSERT INTO review_cases (review_id, report_id, review_reasons, status, raw_payload, decision_notes)
VALUES
(
    'REV-RPT-INIT-005',
    'RPT-INIT-005',
    '["IMAGE_TEXT_MISMATCH_OR_UNCLEAR", "VISION_UNCERTAIN"]'::jsonb,
    'PENDING',
    '{"report_id": "RPT-INIT-005", "description": "Citizen reported broken street sign but image shows normal cat", "media_ref": "mock://unrelated"}'::jsonb,
    'Flagged by Gate 2: Description mentioned traffic sign, but image classification returned unrelated animal. Human inspection required.'
)
ON CONFLICT (review_id) DO NOTHING;
