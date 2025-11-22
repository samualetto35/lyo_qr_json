import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { TeacherService } from '../services/teacher.service';

@Controller('teacher')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.teacherService.getProfile(user.sub);
  }
}

