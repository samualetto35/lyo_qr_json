import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from '../dto/course.dto';
import { AuditService } from './audit.service';

@Injectable()
export class AdminCoursesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(filters: { teacher_id?: string; is_active?: boolean; search?: string }) {
    const where: any = {};

    if (filters.teacher_id) {
      where.teacherId = filters.teacher_id;
    }

    if (filters.is_active !== undefined) {
      where.isActive = filters.is_active;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' as const } },
        { code: { contains: filters.search, mode: 'insensitive' as const } },
      ];
    }

    const courses = await this.prisma.course.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      description: c.description,
      is_active: c.isActive,
      teacher: {
        id: c.teacher.id,
        name: `${c.teacher.firstName} ${c.teacher.lastName}`,
        email: c.teacher.email,
      },
      students_count: c._count.enrollments,
      created_at: c.createdAt,
    }));
  }

  async create(dto: CreateCourseDto, adminId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: dto.teacher_id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const course = await this.prisma.course.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        teacherId: dto.teacher_id,
      },
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await this.auditService.log({
      actorType: 'admin',
      actorId: adminId,
      action: 'CREATE_COURSE',
      entityType: 'course',
      entityId: course.id,
      afterData: { name: course.name, code: course.code, teacherId: course.teacherId },
    });

    return {
      id: course.id,
      name: course.name,
      code: course.code,
      description: course.description,
      teacher_name: `${course.teacher.firstName} ${course.teacher.lastName}`,
    };
  }

  async update(id: string, dto: UpdateCourseDto, adminId: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (dto.teacher_id) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: dto.teacher_id },
      });
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.teacher_id !== undefined) updateData.teacherId = dto.teacher_id;
    if (dto.is_active !== undefined) updateData.isActive = dto.is_active;

    const updated = await this.prisma.course.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.log({
      actorType: 'admin',
      actorId: adminId,
      action: 'UPDATE_COURSE',
      entityType: 'course',
      entityId: id,
      beforeData: course,
      afterData: updated,
    });

    return {
      id: updated.id,
      name: updated.name,
      code: updated.code,
      description: updated.description,
      is_active: updated.isActive,
    };
  }
}

