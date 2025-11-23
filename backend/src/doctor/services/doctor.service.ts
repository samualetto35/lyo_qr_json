import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMedicalReportDto, GetReportsDto } from '../dto/doctor.dto';

@Injectable()
export class DoctorService {
  constructor(private prisma: PrismaService) {}

  async createReport(dto: CreateMedicalReportDto, doctorId: string) {
    // Find student
    const student = await this.prisma.student.findUnique({
      where: { studentId: dto.student_id },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.student_id} not found`);
    }

    // Check if report already exists for this date
    const existing = await this.prisma.medicalReport.findUnique({
      where: {
        studentId_reportDate: {
          studentId: student.id,
          reportDate: new Date(dto.report_date),
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Report already exists for this student on this date');
    }

    const report = await this.prisma.medicalReport.create({
      data: {
        studentId: student.id,
        doctorId,
        reportDate: new Date(dto.report_date),
      },
      include: {
        student: true,
      },
    });

    return {
      id: report.id,
      student_id: report.student.studentId,
      student_name: `${report.student.firstName} ${report.student.lastName}`,
      report_date: report.reportDate,
      created_at: report.createdAt,
    };
  }

  async getReports(dto: GetReportsDto, doctorId: string) {
    const where: any = { doctorId };

    if (dto.student_id) {
      const student = await this.prisma.student.findUnique({
        where: { studentId: dto.student_id },
      });
      if (student) {
        where.studentId = student.id;
      } else {
        return { data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } };
      }
    }

    if (dto.start_date || dto.end_date) {
      where.reportDate = {};
      if (dto.start_date) {
        where.reportDate.gte = new Date(dto.start_date);
      }
      if (dto.end_date) {
        where.reportDate.lte = new Date(dto.end_date);
      }
    }

    const [reports, total] = await Promise.all([
      this.prisma.medicalReport.findMany({
        where,
        include: {
          student: true,
        },
        orderBy: { reportDate: 'desc' },
      }),
      this.prisma.medicalReport.count({ where }),
    ]);

    return {
      data: reports.map((r) => ({
        id: r.id,
        student_id: r.student.studentId,
        student_name: `${r.student.firstName} ${r.student.lastName}`,
        report_date: r.reportDate,
        created_at: r.createdAt,
      })),
      meta: {
        total,
        page: 1,
        pageSize: 20,
        totalPages: Math.ceil(total / 20),
      },
    };
  }

  async getStudents(page = 1, pageSize = 20, search?: string) {
    const skip = (page - 1) * pageSize;
    const where: any = {
      isActive: true,
      ...(search
        ? {
            OR: [
              { studentId: { contains: search, mode: 'insensitive' as const } },
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
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
      this.prisma.student.count({ where }),
    ]);

    return {
      data: students.map((s) => ({
        id: s.id,
        student_id: s.studentId,
        first_name: s.firstName,
        last_name: s.lastName,
        gender: s.gender,
        program: s.program,
        reports_count: s._count.medicalReports,
      })),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async deleteReport(reportId: string, doctorId: string) {
    const report = await this.prisma.medicalReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.doctorId !== doctorId) {
      throw new BadRequestException('You can only delete your own reports');
    }

    await this.prisma.medicalReport.delete({
      where: { id: reportId },
    });

    return { success: true };
  }
}

