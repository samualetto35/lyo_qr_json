import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';

@Injectable()
export class AdminSettingsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getSettings() {
    const settings = await this.prisma.systemSettings.findFirst();

    if (!settings) {
      // Create default settings if none exist
      return this.prisma.systemSettings.create({
        data: {
          maxSessionDurationMinutes: 240,
          minSessionDurationMinutes: 1,
          maxSubmissionsPerDevicePerSession: 1,
          maxSubmissionsPerIpPerSession: 200,
          geofenceEnabled: false,
          geoRequired: false,
          offlineRetriesAllowed: 3,
        },
      });
    }

    return settings;
  }

  async updateSettings(data: Partial<any>, adminId: string) {
    const currentSettings = await this.getSettings();

    const updateData: any = {};

    if (data.max_session_duration_minutes !== undefined)
      updateData.maxSessionDurationMinutes = data.max_session_duration_minutes;
    if (data.min_session_duration_minutes !== undefined)
      updateData.minSessionDurationMinutes = data.min_session_duration_minutes;
    if (data.max_submissions_per_device_per_session !== undefined)
      updateData.maxSubmissionsPerDevicePerSession = data.max_submissions_per_device_per_session;
    if (data.max_submissions_per_ip_per_session !== undefined)
      updateData.maxSubmissionsPerIpPerSession = data.max_submissions_per_ip_per_session;
    if (data.geofence_enabled !== undefined)
      updateData.geofenceEnabled = data.geofence_enabled;
    if (data.geofence_center_lat !== undefined)
      updateData.geofenceCenterLat = data.geofence_center_lat;
    if (data.geofence_center_lng !== undefined)
      updateData.geofenceCenterLng = data.geofence_center_lng;
    if (data.geofence_radius_meters !== undefined)
      updateData.geofenceRadiusMeters = data.geofence_radius_meters;
    if (data.geo_required !== undefined) updateData.geoRequired = data.geo_required;
    if (data.offline_retries_allowed !== undefined)
      updateData.offlineRetriesAllowed = data.offline_retries_allowed;

    const updated = await this.prisma.systemSettings.update({
      where: { id: currentSettings.id },
      data: updateData,
    });

    await this.auditService.log({
      actorType: 'admin',
      actorId: adminId,
      action: 'UPDATE_SYSTEM_SETTINGS',
      entityType: 'system_settings',
      entityId: currentSettings.id,
      beforeData: currentSettings,
      afterData: updated,
    });

    return updated;
  }
}

