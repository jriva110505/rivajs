import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

@Injectable()
export class PositionsService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async getAll() {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT id, position_code, position_name, created_at FROM positions'
    );
    return rows;
  }

 async createPositions(position_code: string, position_name: string, userId: any) {
  const [result] = await this.pool().execute<ResultSetHeader>(
    'INSERT INTO positions (position_code, position_name, id) VALUES ( ?, ?, ?)',
    [position_code, position_name, userId]
  );
  return { position_id: result.insertId, position_code, position_name, id: userId};
}

  async findById(position_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT id, position_code, position_name, created_at FROM positions WHERE id = ?',
      [position_id]
    );
    return rows[0];
  }

  async updatePositions(position_id: number, partial: { position_code?: string; position_name?: string }) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.position_code) {
      fields.push('position_code = ?');
      values.push(partial.position_code);
    }

    if (partial.position_name) {
      fields.push('position_name = ?');
      values.push(partial.position_name);
    }

    if (!fields.length) return await this.findById(position_id);

    const sql = `UPDATE positions SET ${fields.join(', ')} WHERE id = ?`;
    values.push(position_id);
    await this.pool().execute<ResultSetHeader>(sql, values);
    return this.findById(position_id);
  }

  async deletePositions(position_id: number) {
    const [res] = await this.pool().execute<ResultSetHeader>(
      'DELETE FROM positions WHERE id = ?',
      [position_id]
    );
    return res.affectedRows;
  }
}
