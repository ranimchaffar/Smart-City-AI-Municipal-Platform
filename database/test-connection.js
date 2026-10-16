import pg from 'pg';
const { Pool } = pg;

async function test() {
  const hosts = ['127.0.0.1', 'localhost'];
  for (const host of hosts) {
    try {
      console.log(`Testing connection to ${host}:5432...`);
      const pool = new Pool({
        connectionString: `postgresql://postgres:postgres@${host}:5432/municipal_tickets`,
        connectionTimeoutMillis: 3000,
      });
      const res = await pool.query('SELECT version();');
      console.log(`✅ SUCCESS connecting to ${host}:`, res.rows[0].version);
      await pool.end();
      return `postgresql://postgres:postgres@${host}:5432/municipal_tickets`;
    } catch (e) {
      console.log(`❌ Failed on ${host}:`, e.message);
    }
  }
}

test().catch(console.error);
