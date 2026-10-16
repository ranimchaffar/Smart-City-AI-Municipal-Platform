import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/municipal_tickets',
});

client.connect()
  .then(() => client.query('SELECT version();'))
  .then((res) => {
    console.log('✅ POSTGRES NATIVE QUERY SUCCESS:', res.rows[0].version);
    return client.query('SELECT current_database(), current_user;');
  })
  .then((res) => {
    console.log('✅ DATABASE & USER:', res.rows[0]);
    return client.end();
  })
  .catch((err) => {
    console.error('❌ POSTGRES ERROR:', err);
    process.exit(1);
  });
