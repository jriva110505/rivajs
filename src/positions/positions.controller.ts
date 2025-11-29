import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { PositionsService } from './positions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('positions')
export class PositionsController {
  constructor(private positionsService: PositionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.positionsService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':position_id')
  async getOne(@Param('position_id') position_id: string) {
    return this.positionsService.findById(+position_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() body: { position_code: string; position_name: string },
    @Req() req: Request,
  ) {
    const user: any = req['user'];
    const userId = user?.id || null;
    return this.positionsService.createPositions(
      body.position_code,
      body.position_name,
      userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put(':position_id')
  async update(@Param('position_id') position_id: string, @Body() body: any) {
    return this.positionsService.updatePositions(+position_id, body);
  }


  @UseGuards(JwtAuthGuard)
  @Delete(':position_id')
  async remove(@Param('position_id') position_id: string) {
    const deleted = await this.positionsService.deletePositions(+position_id);

    if (deleted === 0) {
      throw new NotFoundException(`Position with ID ${position_id} not found`);
    }

    return { message: `Position ${position_id} deleted successfully` };
  }
}
