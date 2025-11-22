import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { DoctorService } from '../services/doctor.service';
import { CreateMedicalReportDto, GetReportsDto } from '../dto/doctor.dto';

@Controller('doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post('reports')
  async createReport(
    @Body() dto: CreateMedicalReportDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.doctorService.createReport(dto, user.sub);
  }

  @Get('reports')
  async getReports(
    @Query() query: GetReportsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.doctorService.getReports(query, user.sub);
  }

  @Delete('reports/:id')
  async deleteReport(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.doctorService.deleteReport(id, user.sub);
  }

  @Get('students')
  async getStudents(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.doctorService.getStudents(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
      search,
    );
  }
}

