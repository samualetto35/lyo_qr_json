import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { AdminDoctorsService } from '../services/admin-doctors.service';
import { CreateDoctorDto, UpdateDoctorDto } from '../dto/doctor.dto';

@Controller('admin/doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminDoctorsController {
  constructor(private readonly doctorsService: AdminDoctorsService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.doctorsService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
      search,
    );
  }

  @Post()
  async create(@Body() dto: CreateDoctorDto, @CurrentUser() user: CurrentUserPayload) {
    return this.doctorsService.create(dto, user.sub);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDoctorDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.doctorsService.update(id, dto, user.sub);
  }
}

