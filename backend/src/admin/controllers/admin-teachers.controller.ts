import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { AdminTeachersService } from '../services/admin-teachers.service';
import { CreateTeacherDto, UpdateTeacherDto } from '../dto/teacher.dto';

@Controller('admin/teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminTeachersController {
  constructor(private readonly teachersService: AdminTeachersService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.teachersService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
      search,
    );
  }

  @Post()
  async create(@Body() dto: CreateTeacherDto, @CurrentUser() user: CurrentUserPayload) {
    return this.teachersService.create(dto, user.sub);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTeacherDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.teachersService.update(id, dto, user.sub);
  }
}

