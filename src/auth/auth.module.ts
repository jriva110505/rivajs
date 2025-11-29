import { Module } from '@nestjs/common';
import { AuthService } from "./auth.service";
import { AuthController } from './auth.controller'; 
import { UsersModule } from '../users/users.module'; 
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport'; 
import { JwtStrategy } from './jwt.strategy';

const jwtSecret: string = process.env.WT_ACCESS_TOKEN_SECRET || 'access_secret';
const tokenExpiry: string = process.env.ACCESS_TOKEN_EXPIRES_IN || '900s'; // default 900 seconds

@Module({
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.register({
            secret: jwtSecret,
            signOptions: { expiresIn: tokenExpiry },
        }),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
})
export class AuthModule {}
