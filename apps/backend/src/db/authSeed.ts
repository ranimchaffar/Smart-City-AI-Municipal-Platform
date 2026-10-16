import argon2 from 'argon2';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/municipal_tickets',
});

async function seed() {
  console.log('Seeding initial authenticated users with Argon2id...');

  const usersToSeed = [
    {
      name: 'Directeur Général des Services',
      email: 'admin@ville-intelligente.tn',
      password: process.env.ADMIN_INITIAL_PASSWORD || 'AdminSecure2026!',
      role: 'ADMINISTRATOR',
      department: 'DIRECTION_GENERALE',
      phone: '+216 71 000 001',
    },
    {
      name: 'Karim Ben Salah (Responsable Voirie)',
      email: 'agent.voirie@ville-intelligente.tn',
      password: process.env.AGENT_INITIAL_PASSWORD || 'AgentSecure2026!',
      role: 'MUNICIPAL_AGENT',
      department: 'ROADS_DEPARTMENT',
      phone: '+216 71 000 002',
    },
    {
      name: 'Sarra Mansour (Technicienne Éclairage)',
      email: 'agent.eclairage@ville-intelligente.tn',
      password: process.env.AGENT_INITIAL_PASSWORD || 'AgentSecure2026!',
      role: 'MUNICIPAL_AGENT',
      department: 'PUBLIC_LIGHTING_DEPARTMENT',
      phone: '+216 71 000 003',
    },
    {
      name: 'Yassine Trabelsi (Citoyen)',
      email: 'citoyen.test@ville-intelligente.tn',
      password: process.env.CITIZEN_INITIAL_PASSWORD || 'CitoyenSecure2026!',
      role: 'CITIZEN',
      department: null,
      phone: '+216 98 123 456',
    },
  ];

  for (const u of usersToSeed) {
    const existing = await pool.query('SELECT id, email FROM users WHERE email = $1', [u.email]);
    if (existing.rows.length === 0) {
      const passwordHash = await argon2.hash(u.password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });

      await pool.query(
        `INSERT INTO users (name, email, password_hash, role, department, phone, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [u.name, u.email, passwordHash, u.role, u.department, u.phone]
      );
      console.log(` Created user: ${u.email} [${u.role}]`);
    } else {
      console.log(` User already exists: ${u.email}`);
    }
  }

  await pool.end();
  console.log('Seeding completed successfully.');
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
