const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'test',
  port: Number(process.env.DB_PORT) || 3306,
};

// Hash password function
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Main function
async function registerUser() {
  // Parse command line arguments
  const email = process.argv[2];
  const password = process.argv[3];

  // Validate inputs
  if (!email || !password) {
    console.error('Error: Email and password are required');
    console.log('Usage: node scripts/register-user.js <email> <password>');
    process.exit(1);
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('Error: Invalid email format');
    process.exit(1);
  }

  // Password validation (minimum 8 characters)
  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters long');
    process.exit(1);
  }

  let connection;
  try {
    // Create database connection
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database.');
    
    // Check if users table exists, create if not
    console.log('Checking if users table exists...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      console.error('Error: User with this email already exists');
      process.exit(1);
    }

    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await hashPassword(password);

    // Insert the new user
    console.log('Creating user...');
    await connection.execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );

    console.log(`Success: User ${email} registered successfully`);
  } catch (error) {
    console.error('Error registering user:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the function
registerUser().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});