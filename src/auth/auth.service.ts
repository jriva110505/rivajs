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
        if (valid) return { id: user.id, username: user.username, role: user.role };
        return null;
    }

    async login({ users }: { users: { id: number; username: string; role: string } }) {
        const payload = { sub: users.id, username: users.username, role: users.role };

        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.WT_ACCESS_TOKEN_SECRET as string || 'access_secret',
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as string || '900s',
        });

        const refreshToken = Jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET as string || 'refresh_secret', {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as string || '7d',
        });

        await this.usersService.setRefreshToken(users.id, refreshToken);

        return { accessToken, refreshToken };
    }

    async logout(userId: number) {
        await this.usersService.setRefreshToken(userId, null);
        return { ok: true };
    }

    async refreshTokens(refreshToken: string) {
        try {
            const secret = process.env.JWT_REFRESH_TOKEN_SECRET as string || 'refresh_secret';
            const decoded = Jwt.verify(refreshToken, secret) as unknown as { sub: number; username: string; role: string };

            const found = await this.usersService.findByRefreshToken(refreshToken);
            if (!found) throw new UnauthorizedException('Invalid refresh token');

            const payload = { sub: found.id, username: found.username, role: found.role };

            const accessToken = this.jwtService.sign(payload, {
                secret: process.env.WT_ACCESS_TOKEN_SECRET as string || 'access_secret',
                expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as string || '900s',
            });

            const newRefreshToken = Jwt.sign(payload, secret, {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as string || '7d',
            });

            await this.usersService.setRefreshToken(found.id, newRefreshToken);

            return { accessToken, refreshToken: newRefreshToken };
        } catch (err) {
            throw new UnauthorizedException('Could not refresh tokens');
        }
    }
}
