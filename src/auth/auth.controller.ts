import { Controller, Post, Body, UseGuards,Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private usersService: UsersService) {}

    @Post('register')
    async register(@Body() body: { username: string; password: string; age: number }){
        return this.usersService.createUser(body.username, body.password, body.age);
    }

    @Post('login')
    async login(@Body() body: { username: string; password: string }) {
        const users = await this.authService.validateUser(body.username, body.password);
        if (!users) return { error: 'invalid credential' };
        return this.authService.login({ users });
    }

    @Post('logout')
    async logout(@Body() body: { userId: number }) {
        return this.authService.logout(body.userId);
    }

    @Post('refresh')
    async refresh(@Body() Body: { refreshToken: string }) {
        return this.authService.refreshTokens(Body.refreshToken);
    }
}