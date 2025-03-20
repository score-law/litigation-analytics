import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'test',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

// Generic query function with proper typing
export async function query<T extends mysql.RowDataPacket[]>(sql: string, params: any[] = []): Promise<T> {
    try {
      const connection = await pool.getConnection();
      const [results] = await connection.execute<T>(sql, params);
      connection.release();
      return results;
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Database query failed');
    }
  }