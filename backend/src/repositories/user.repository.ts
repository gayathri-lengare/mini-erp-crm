import { query } from '../config/db.js';
import { User, SafeUser } from '../types/index.js';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const res = await query<User>('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    return res.rows[0] || null;
  }

  async findById(id: number): Promise<SafeUser | null> {
    const res = await query<SafeUser>(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  }

  async findAll(): Promise<SafeUser[]> {
    const res = await query<SafeUser>(
      'SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY id ASC'
    );
    return res.rows;
  }

  async create(user: { name: string; email: string; password_hash: string; role: string }): Promise<SafeUser> {
    const res = await query<SafeUser>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, updated_at`,
      [user.name.trim(), user.email.toLowerCase().trim(), user.password_hash, user.role]
    );
    return res.rows[0];
  }
}

export const userRepository = new UserRepository();
