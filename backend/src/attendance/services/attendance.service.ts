import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitAttendanceDto } from '../dto/attendance.dto';
import { normalizeStudentId, calculateDistance } from '../../common/utils/normalization.util';
import { Request } from 'express';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async validateSession(attendanceSessionId: string, qrToken: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: attendanceSessionId },
      include: {
        course: {
          select: { name: true },
        },
        teacher: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!session) {
      return {
        valid: false,
        reason: 'Session not found',
      };
    }

    if (session.qrToken !== qrToken) {
      return {
        valid: false,
        reason: 'Invalid token',
      };
    }

    const now = new Date();

    // Check hard expiration
    if (now > session.hardExpiresAt) {
      // Auto-close if still marked as open
      if (session.isOpen) {
        await this.prisma.attendanceSession.update({
          where: { id: attendanceSessionId },
          data: {
            isOpen: false,
            endTime: now,
          },
        });
      }
      return {
        valid: false,
        reason: 'Session has expired',
      };
    }

    if (!session.isOpen) {
      return {
        valid: false,
        reason: 'Session is closed',
      };
    }

    const settings = await this.prisma.systemSettings.findFirst();

    return {
      valid: true,
      course_name: session.course.name,
      teacher_name: `${session.teacher.firstName} ${session.teacher.lastName}`,
      session_name: session.sessionName,
      session_date: session.sessionDate,
      is_open: session.isOpen,
      requires_geo: settings?.geofenceEnabled || settings?.geoRequired || false,
    };
  }

  async submitAttendance(dto: SubmitAttendanceDto, req: Request) {
    // Step 1: Normalize student ID
    const normalizedStudentId = normalizeStudentId(dto.student_id);

    if (!normalizedStudentId) {
      throw new BadRequestException('Student ID is required');
    }

    // Step 2: Fetch session
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: dto.attendance_session_id },
    });

    if (!session) {
      throw new BadRequestException('Invalid session');
    }

    // Step 3: Verify QR token
    if (session.qrToken !== dto.qr_token) {
      throw new BadRequestException('Invalid token');
    }

    // Step 4 & 5: Check session time validity
    const now = new Date();

    if (now > session.hardExpiresAt) {
      // Auto-close and reject
      if (session.isOpen) {
        await this.prisma.attendanceSession.update({
          where: { id: dto.attendance_session_id },
          data: {
            isOpen: false,
            endTime: now,
          },
        });

        await this.prisma.fraudSignal.create({
          data: {
            attendanceSessionId: dto.attendance_session_id,
            courseId: session.courseId,
            clientDeviceId: dto.client_device_id,
            clientIp: req.ip,
            signalType: 'session_expired_submission',
            details: 'Attempt to submit attendance after session hard expiration',
          },
        });
      }

      throw new BadRequestException('Session closed');
    }

    // Step 6: Check if session is open
    if (!session.isOpen) {
      throw new BadRequestException('Session closed');
    }

    // Get system settings
    const settings = await this.prisma.systemSettings.findFirst();

    if (!settings) {
      throw new BadRequestException('System settings not configured');
    }

    // Step 7: IP rate limiting
    const clientIp = req.ip || 'unknown';

    const ipSubmissions = await this.prisma.attendanceRecord.count({
      where: {
        attendanceSessionId: dto.attendance_session_id,
        clientIp,
      },
    });

    if (ipSubmissions >= settings.maxSubmissionsPerIpPerSession) {
      await this.prisma.fraudSignal.create({
        data: {
          attendanceSessionId: dto.attendance_session_id,
          courseId: session.courseId,
          clientDeviceId: dto.client_device_id,
          clientIp,
          signalType: 'too_many_requests_same_ip',
          details: `IP ${clientIp} exceeded max submissions (${settings.maxSubmissionsPerIpPerSession})`,
        },
      });

      throw new BadRequestException('Too many requests from this network');
    }

    // Step 8: Validate client_device_id (allow but note if missing)
    const deviceId = dto.client_device_id || 'unknown';

    // Step 9: Geofence logic
    if (settings.geofenceEnabled) {
      if (!dto.geo || dto.geo.lat === undefined || dto.geo.lng === undefined) {
        if (settings.geoRequired) {
          throw new BadRequestException('Location permission required to submit attendance');
        }
      } else {
        // Calculate distance
        if (
          settings.geofenceCenterLat &&
          settings.geofenceCenterLng &&
          settings.geofenceRadiusMeters
        ) {
          const distance = calculateDistance(
            dto.geo.lat,
            dto.geo.lng,
            Number(settings.geofenceCenterLat),
            Number(settings.geofenceCenterLng),
          );

          if (distance > Number(settings.geofenceRadiusMeters)) {
            await this.prisma.fraudSignal.create({
              data: {
                attendanceSessionId: dto.attendance_session_id,
                courseId: session.courseId,
                clientDeviceId: deviceId,
                clientIp,
                signalType: 'outside_geofence',
                details: `Submission from ${distance.toFixed(0)}m away, limit is ${settings.geofenceRadiusMeters}m`,
              },
            });

            throw new BadRequestException('You are not in the allowed area');
          }
        }
      }
    }

    // Step 10: Find student
    const student = await this.prisma.student.findUnique({
      where: { studentId: normalizedStudentId },
    });

    if (!student) {
      throw new BadRequestException('Student not found');
    }

    // Step 11: Verify enrollment
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: session.courseId,
          studentId: student.id,
        },
      },
    });

    if (!enrollment) {
      throw new BadRequestException('You are not registered in this course');
    }

    // Step 12: Check for duplicate (idempotent)
    const existingRecord = await this.prisma.attendanceRecord.findUnique({
      where: {
        attendanceSessionId_studentId: {
          attendanceSessionId: dto.attendance_session_id,
          studentId: student.id,
        },
      },
    });

    if (existingRecord) {
      return {
        status: 'success',
        message: 'Attendance recorded successfully',
        already_recorded: true,
        flagged: existingRecord.status === 'flagged',
      };
    }

    // Step 13: Enforce per-device buddy-punching rule
    if (deviceId && deviceId !== 'unknown') {
      const distinctStudentsFromDevice = await this.prisma.attendanceRecord.findMany({
        where: {
          attendanceSessionId: dto.attendance_session_id,
          clientDeviceId: deviceId,
        },
        distinct: ['studentId'],
      });

      if (distinctStudentsFromDevice.length >= settings.maxSubmissionsPerDevicePerSession) {
        await this.prisma.fraudSignal.create({
          data: {
            attendanceSessionId: dto.attendance_session_id,
            courseId: session.courseId,
            studentId: student.id,
            clientDeviceId: deviceId,
            clientIp,
            signalType: 'multiple_ids_same_device',
            details: `Device already submitted for ${distinctStudentsFromDevice.length} distinct student(s)`,
          },
        });

        throw new BadRequestException('This device already submitted attendance for this session');
      }
    }

    // Step 14: Create attendance record
    const record = await this.prisma.attendanceRecord.create({
      data: {
        attendanceSessionId: dto.attendance_session_id,
        courseId: session.courseId,
        studentId: student.id,
        studentIdValue: student.studentId,
        status: 'present',
        submittedAt: now,
        submittedVia: 'qr',
        submittedByTeacherId: null,
        clientDeviceId: deviceId,
        clientIp,
        clientUserAgent: req.headers['user-agent'] || null,
        clientGeoLat: dto.geo?.lat || null,
        clientGeoLng: dto.geo?.lng || null,
        clientGeoAccuracyM: dto.geo?.accuracy_meters || null,
        fraudFlagReason: null,
      },
    });

    // Step 16: Return success
    return {
      status: 'success',
      message: 'Attendance recorded successfully',
      already_recorded: false,
      flagged: false,
    };
  }
}

