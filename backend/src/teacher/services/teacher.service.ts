import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) {}

  async getProfile(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return {
      id: teacher.id,
      email: teacher.email,
      first_name: teacher.firstName,
      last_name: teacher.lastName,
      courses_count: teacher._count.courses,
    };
  }
}

