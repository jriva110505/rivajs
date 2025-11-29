import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  getAll() {
      throw new Error('Method not implemented.');
  }
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async createUser(username: string, password: string, age: number, role = 'user') {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO users (username, password, age, role) VALUES (?, ?, ?, ?)',
      [username, hashed, age, role],
    );
    return { id: result.insertId, username, age, role };
  }

  async findByUsername(username: string) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT id, username, password, age, role, refresh_token FROM users WHERE username = ?',
      [username],
    );
    return rows[0];
  }

  async findById(id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT id, username, age role, created_at FROM users WHERE id = ?',
      [id],
    );
    return rows[0];
  }

  async findAll() {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT id, username, age role, created_at FROM users',
    );
    return rows;
  }

  async updateUser(id: number, partial: { username?: string; password?: string; age?: number; role?: string }) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.username) {
      fields.push('username = ?');
      values.push(partial.username);
    }

    if (partial.password) {
      const hashed = await bcrypt.hash(partial.password, 10);
      fields.push('password = ?');
      values.push(hashed);
    }

    if (partial.age) {
      fields.push('age = ?');
      values.push(partial.age);
    }

    if (partial.role) {
      fields.push('role = ?');
      values.push(partial.role);
    }

    if (!fields.length) return await this.findById(id);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    await this.pool().execute<OkPacket>(sql, values);
    return this.findById(id);
  }

  async deleteUser(id: number) {
    const [res] = await this.pool().execute<OkPacket>(
      'DELETE FROM users WHERE id = ?',
      [id],
    );
    return res.affectedRows;
  }

  async setRefreshToken(id: number, refreshToken: string | null) {
    await this.pool().execute(
      'UPDATE users SET refresh_token = ? WHERE id = ?',
      [refreshToken, id],
    );
  }

  async findByRefreshToken(refreshToken: string) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT id, username, role FROM users WHERE refresh_token = ?',
      [refreshToken],
    );
    return rows[0];
  }
}
