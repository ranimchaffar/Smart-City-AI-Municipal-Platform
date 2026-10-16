import React from 'react';
import { Users, Mail, Phone, Shield, Building, Award } from 'lucide-react';

export const TeamView: React.FC = () => {
  const departments = [
    {
      name: 'Direction de la Voirie & des Chaussées',
      code: 'ROADS_DEPARTMENT',
      lead: 'Ing. Marouan Ben Salah',
      email: 'voirie@ville-intelligente.tn',
      phone: '+216 71 001 100',
      description: 'Entretien des chaussées, réfection d’asphalte, nids de poule et signalisation routière.',
      agents: [
        { name: 'Marouan Ben Salah', role: 'Chef de Brigade', email: 'agent.voirie@ville-intelligente.tn', active: true },
        { name: 'Kamel Rezgui', role: 'Inspecteur Technique', email: 'kamel.r@ville-intelligente.tn', active: true },
      ],
    },
    {
      name: 'Direction de l’Éclairage Public',
      code: 'PUBLIC_LIGHTING_DEPARTMENT',
      lead: 'Mme. Samia Dridi',
      email: 'eclairage@ville-intelligente.tn',
      phone: '+216 71 001 200',
      description: 'Supervision du réseau électrique municipal, réparation des candélabres et sécurité nocturne.',
      agents: [
        { name: 'Samia Dridi', role: 'Ingénieure Réseau', email: 'agent.eclairage@ville-intelligente.tn', active: true },
      ],
    },
    {
      name: 'Direction de la Propreté & Salubrité',
      code: 'SANITATION_DEPARTMENT',
      lead: 'M. Tarak Mansour',
      email: 'salubrite@ville-intelligente.tn',
      phone: '+216 71 001 300',
      description: 'Collecte des déchets ménagers, éradication des décharges sauvages et nettoiement urbain.',
      agents: [
        { name: 'Tarak Mansour', role: 'Coordinateur Propreté', email: 'tarak.m@ville-intelligente.tn', active: true },
      ],
    },
    {
      name: 'Direction des Services de l’Eau',
      code: 'WATER_SERVICES_DEPARTMENT',
      lead: 'Ing. Fatma Chaabane',
      email: 'eau@ville-intelligente.tn',
      phone: '+216 71 001 400',
      description: 'Maintenance des conduites d’eau potable, gestion des fuites critiques et assainissement.',
      agents: [
        { name: 'Fatma Chaabane', role: 'Cheffe de Service Hydraulique', email: 'fatma.c@ville-intelligente.tn', active: true },
      ],
    },
  ];

  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building size={22} style={{ color: '#2563eb' }} />
          Directions Municipales & Équipes d'Intervention
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Annuaire opérationnel des services techniques municipaux
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {departments.map((dept) => (
          <div
            key={dept.code}
            style={{
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px',
              background: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  {dept.name}
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Responsable : {dept.lead}</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '10px 0 16px 0', lineHeight: 1.4 }}>
              {dept.description}
            </p>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={12} />
                <span>{dept.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={12} />
                <span>{dept.phone}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                Agents enregistrés ({dept.agents.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dept.agents.map((ag) => (
                  <div key={ag.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{ag.name}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>• {ag.role}</span>
                    </div>
                    <span style={{ color: '#16a34a', fontSize: '10px', fontWeight: 700, background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                      En service
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
