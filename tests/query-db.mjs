import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/municipal_tickets',
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT t.ticket_id, t.report_id, t.category, t.department, t.status, t.persisted, count(e.event_id) as event_count
      FROM tickets t
      LEFT JOIN ticket_events e ON t.ticket_id = e.ticket_id
      GROUP BY t.ticket_id, t.report_id, t.category, t.department, t.status, t.persisted
      ORDER BY t.created_at DESC
      LIMIT 10;
    `);
    console.log('\n🐘 LIVE POSTGRESQL TABLE AUDIT (Direct SQL via pg.Pool):');
    console.table(res.rows);

    const counts = await client.query(`
      SELECT 
        (SELECT count(*) FROM reports) as reports_count,
        (SELECT count(*) FROM tickets) as tickets_count,
        (SELECT count(*) FROM ticket_events) as events_count,
        (SELECT count(*) FROM review_cases) as review_cases_count;
    `);
    console.log('\n📊 POSTGRESQL ROW COUNTS ACROSS ALL PERSISTENCE TABLES:');
    console.table(counts.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
