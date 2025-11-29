import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import * as Jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) {}

    async validateUser(username: string, pass: string) {
        const user = await this.usersService.findByUsername(username);
        if (!user) return null;

        const valid = await bcrypt.compare(pass, user.password);
        if (!valid) return null;

        return {
            id: user.id,
            username: user.username,
            role: user.role,
        };
    }

    async generateToken(user: { id: number; username: string; role: string }) {
        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload);

        const refreshToken = Jwt.sign(
            payload,
            process.env.JWT_REFRESH_TOKEN_SECRET ?? 'refresh_secret',
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d' }
        );

        await this.usersService.setRefreshToken(user.id, refreshToken);

        return { accessToken, refreshToken };
    }

    async login({ user }: { user: { id: number; username: string; role: string } }) {
        return this.generateToken(user);
    }

    async logout(userId: number) {
        await this.usersService.setRefreshToken(userId, null);
        return { ok: true };
    }

    async refreshTokens(refreshToken: string) {
        try {
            const decoded: any = Jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_TOKEN_SECRET ?? 'refresh_secret'
            );

            const user = await this.usersService.findByRefreshToken(refreshToken) as {
                id: number;
                username: string;
                role: string;
            };

            if (!user) throw new UnauthorizedException('Invalid refresh token');

            return this.generateToken(user);

        } catch {
            throw new UnauthorizedException('Could not refresh tokens');
        }
    }
}
