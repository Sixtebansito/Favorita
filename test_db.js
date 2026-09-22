const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://f00a615d40fe6591563eb015bcfba90d64514dc36699dc899d3ad0721b654c24:sk_aQRszbvGbxozXSsq8ZeqL@db.prisma.io:5432/postgres?sslmode=require',
});

pool.query('SELECT * FROM "Cabezal" WHERE tipo = $1', ['OTAWA'], (err, res) => {
  if (err) {
    console.error(err);
  } else {
    console.log('OTAWAS:', res.rows);
  }
  pool.end();
});
