import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { CreateTeacherDto, UpdateTeacherDto } from '../dto/teacher.dto';
import { AuditService } from './audit.service';

@Injectable()
export class AdminTeachersService {
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

    const [teachers, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          _count: {
            select: { courses: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return {
      data: teachers.map((t) => ({
        id: t.id,
        email: t.email,
        first_name: t.firstName,
        last_name: t.lastName,
        is_active: t.isActive,
        courses_count: t._count.courses,
        created_at: t.createdAt,
      })),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async create(dto: CreateTeacherDto, adminId: string) {
    const existing = await this.prisma.teacher.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Teacher with this email already exists');
    }

    const passwordHash = await this.authService.hashPassword(dto.password);

    const teacher = await this.prisma.teacher.create({
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
      action: 'CREATE_TEACHER',
      entityType: 'teacher',
      entityId: teacher.id,
      afterData: { email: teacher.email, name: `${teacher.firstName} ${teacher.lastName}` },
    });

    return {
      id: teacher.id,
      email: teacher.email,
      first_name: teacher.firstName,
      last_name: teacher.lastName,
      is_active: teacher.isActive,
    };
  }

  async update(id: string, dto: UpdateTeacherDto, adminId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const updateData: any = {};
    if (dto.first_name !== undefined) updateData.firstName = dto.first_name;
    if (dto.last_name !== undefined) updateData.lastName = dto.last_name;
    if (dto.is_active !== undefined) updateData.isActive = dto.is_active;
    if (dto.password) {
      updateData.passwordHash = await this.authService.hashPassword(dto.password);
    }

    const updated = await this.prisma.teacher.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.log({
      actorType: 'admin',
      actorId: adminId,
      action: 'UPDATE_TEACHER',
      entityType: 'teacher',
      entityId: id,
      beforeData: {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        isActive: teacher.isActive,
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

