import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import * as Jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
    refreshToken(_refreshToken: string) {
        throw new Error('Method not implemented.');
    }
    constructor(private usersService: UsersService, private jwtService: JwtService) {}

    async validateUser(username: string, pass: string) {
        const users = await this.usersService.findByUsername(username);
        if (!users) return null;
        const valid = await bcrypt.compare(pass, users.password);
        if (valid) return { id: users.id, username: users.username, role: users.role};
        return null;
    }

    async login({ users }: { users: { id: number; username: string; role: string; }; }) {
        const payload = { sub: users.id, username: users.username, role: users.role };
        const accesToken = this.jwtService.sign(payload);
    
        const refreshToken = Jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret', {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
        });

        await this.usersService.setRefreshToken(users.id, refreshToken);

        return {accesToken, refreshToken };
    }


    async logout(userId: number) {
        await this.usersService.setRefreshToken(userId, null);
        return { ok: true };
    }

    async refreshTokens(refreshToken: string) {
        try {
            const decoded: any = Jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret');
            const user = await this.usersService.findById(decoded.sub);
            if (!user) throw new UnauthorizedException('Invalid refresh token');

            const stored = await this.usersService.findById(decoded.sub);
            const poolUser = await this.usersService.findById(decoded.sub);

            const u = await this.usersService.findById(decoded.sub);

            const found = await this.usersService.findByRefreshToken(refreshToken);
            if (!found) throw new UnauthorizedException('Invalid refresh token (not found)');

            const payload = { sub: found.id, username: found.username, role: found.role };
            const accessToken = this.jwtService.sign(payload);
            const newRefresh = Jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret', {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
            });
            await this.usersService.setRefreshToken(found.id, newRefresh);
            return { accessToken, refreshToken: newRefresh};
         } catch (err) {
            throw new UnauthorizedException('Could not refresh tokens');
         }
        }
    
}



