import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { CreateDoctorDto, UpdateDoctorDto } from '../dto/doctor.dto';
import { AuditService } from './audit.service';

@Injectable()
export class AdminDoctorsService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private auditService: AuditService,
  ) {}

  async findAll(page = 1, pageSize = 20, search?: string) {
    const skip = (page - 1) * pageSize;
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [doctors, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          _count: {
            select: { medicalReports: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.doctor.count({ where }),
    ]);

    return {
      data: doctors.map((d) => ({
        id: d.id,
        email: d.email,
        first_name: d.firstName,
        last_name: d.lastName,
        is_active: d.isActive,
        reports_count: d._count.medicalReports,
        created_at: d.createdAt,
      })),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async create(dto: CreateDoctorDto, adminId: string) {
    const existing = await this.prisma.doctor.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Doctor with this email already exists');
    }

    const passwordHash = await this.authService.hashPassword(dto.password);

    const doctor = await this.prisma.doctor.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.first_name,
        lastName: dto.last_name,
      },
    });

    await this.auditService.log({
      actorType: 'admin',
      actorId: adminId,
      action: 'CREATE_DOCTOR',
      entityType: 'doctor',
      entityId: doctor.id,
      afterData: { email: doctor.email, name: `${doctor.firstName} ${doctor.lastName}` },
    });

    return {
      id: doctor.id,
      email: doctor.email,
      first_name: doctor.firstName,
      last_name: doctor.lastName,
      is_active: doctor.isActive,
    };
  }

  async update(id: string, dto: UpdateDoctorDto, adminId: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const updateData: any = {};
    if (dto.first_name !== undefined) updateData.firstName = dto.first_name;
    if (dto.last_name !== undefined) updateData.lastName = dto.last_name;
    if (dto.is_active !== undefined) updateData.isActive = dto.is_active;
    if (dto.password) {
      updateData.passwordHash = await this.authService.hashPassword(dto.password);
    }

    const updated = await this.prisma.doctor.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.log({
      actorType: 'admin',
      actorId: adminId,
      action: 'UPDATE_DOCTOR',
      entityType: 'doctor',
      entityId: id,
      beforeData: {
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        isActive: doctor.isActive,
      },
      afterData: {
        firstName: updated.firstName,
        lastName: updated.lastName,
        isActive: updated.isActive,
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      first_name: updated.firstName,
      last_name: updated.lastName,
      is_active: updated.isActive,
    };
  }
}

