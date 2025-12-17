import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000, // 10 seconds
  statement_timeout: 30000, // 30 seconds
});

const sql = async (strings, ...values) => {
  const client = await pool.connect();
  try {
    let query = strings[0];
    const params = [];
    for (let i = 0; i < values.length; i++) {
      params.push(values[i]);
      query += `$${i + 1}` + strings[i + 1];
    }
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
};

export default sql;
