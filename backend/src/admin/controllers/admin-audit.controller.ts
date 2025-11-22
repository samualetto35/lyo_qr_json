import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminAuditService } from '../services/admin-audit.service';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminAuditController {
  constructor(private readonly auditService: AdminAuditService) {}

  @Get()
  async getAuditLogs(
    @Query('action') action?: string,
    @Query('actor_type') actorType?: string,
    @Query('entity_type') entityType?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getAuditLogs({
      action,
      actorType,
      entityType,
      search,
      limit: limit ? parseInt(limit) : 100,
    });
  }
}

