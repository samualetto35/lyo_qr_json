import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

@Injectable()
export class AdminHealthSystemService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async uploadStudents(
    file: Express.Multer.File,
    adminId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    console.log('📁 Health System File upload:', {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });

    // Parse CSV or Excel
    const rows = await this.parseFile(file);

    console.log('📊 Parsed rows:', {
      count: rows.length,
      firstRow: rows[0],
      keys: rows[0] ? Object.keys(rows[0]) : [],
    });

    if (rows.length === 0) {
      throw new BadRequestException('File is empty or has no valid rows');
    }

    // Validate required columns
    const requiredColumns = ['student_id', 'name', 'surname'];
    const firstRowKeys = rows[0] ? Object.keys(rows[0]).map(k => k.toLowerCase()) : [];
    const missingColumns = requiredColumns.filter(
      col => !firstRowKeys.some(key => key.includes(col.replace('_', '')) || key === col)
    );

    if (missingColumns.length > 0) {
      throw new BadRequestException(
        `Missing required columns: ${missingColumns.join(', ')}. Found columns: ${Object.keys(rows[0] || {}).join(', ')}`
      );
    }

    // Normalize column names
    const normalizedRows = rows.map(row => {
      const normalized: any = {};
      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase().trim();
        if (lowerKey.includes('student_id') || lowerKey === 'studentid') {
          normalized.student_id = String(row[key] || '').trim();
        } else if (lowerKey.includes('name') && !lowerKey.includes('surname') && !lowerKey.includes('last')) {
          normalized.name = String(row[key] || '').trim();
        } else if (lowerKey.includes('surname') || lowerKey.includes('last_name') || lowerKey === 'lastname') {
          normalized.surname = String(row[key] || '').trim();
        } else if (lowerKey.includes('gender')) {
          normalized.gender = String(row[key] || '').trim();
        } else if (lowerKey.includes('program')) {
          normalized.program = String(row[key] || '').trim();
        }
      });
      return normalized;
    });

    // Process students
    let created = 0;
    let updated = 0;
    let errors: string[] = [];

    for (const row of normalizedRows) {
      if (!row.student_id || !row.name || !row.surname) {
        errors.push(`Row missing required fields: student_id=${row.student_id}, name=${row.name}, surname=${row.surname}`);
        continue;
      }

      try {
        const existing = await this.prisma.healthSystemStudent.findUnique({
          where: { studentId: row.student_id },
        });

        if (existing) {
          await this.prisma.healthSystemStudent.update({
            where: { id: existing.id },
            data: {
              firstName: row.name,
              lastName: row.surname,
              gender: row.gender || existing.gender,
              program: row.program || existing.program,
            },
          });
          updated++;
        } else {
          await this.prisma.healthSystemStudent.create({
            data: {
              studentId: row.student_id,
              firstName: row.name,
              lastName: row.surname,
              gender: row.gender || null,
              program: row.program || null,
            },
          });
          created++;
        }
      } catch (error: any) {
        errors.push(`Error processing student_id ${row.student_id}: ${error.message}`);
      }
    }

    await this.auditService.log({
      actorType: 'admin',
      actorId: adminId,
      action: 'IMPORT_HEALTH_SYSTEM_STUDENTS',
      entityType: 'health_system_student',
      entityId: null,
      afterData: {
        filename: file.originalname,
        created,
        updated,
        errors: errors.length,
      },
    });

    return {
      created,
      updated,
      total: rows.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async findAllStudents(page = 1, pageSize = 20, search?: string) {
    const skip = (page - 1) * pageSize;
    const where = search
      ? {
          OR: [
            { studentId: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [students, total] = await Promise.all([
      this.prisma.healthSystemStudent.findMany({
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
      this.prisma.healthSystemStudent.count({ where }),
    ]);

    return {
      data: students.map((s) => ({
        id: s.id,
        student_id: s.studentId,
        first_name: s.firstName,
        last_name: s.lastName,
        gender: s.gender,
        program: s.program,
        is_active: s.isActive,
        reports_count: s._count.medicalReports,
        created_at: s.createdAt,
      })),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  private async parseFile(file: Express.Multer.File): Promise<any[]> {
    const ext = file.originalname.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'csv') {
        return this.parseCSV(file.buffer.toString());
      } else if (ext === 'xlsx' || ext === 'xls') {
        return this.parseExcel(file.buffer);
      } else {
        throw new BadRequestException('Unsupported file format. Use CSV or Excel');
      }
    } catch (error: any) {
      console.error('❌ File parse error:', error.message);
      throw new BadRequestException(`Failed to parse file: ${error.message}`);
    }
  }

  private parseCSV(content: string): any[] {
    const parsed = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
    });

    return parsed.data as any[];
  }

  private parseExcel(buffer: Buffer): any[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const parsed = XLSX.utils.sheet_to_json(firstSheet, {
      raw: false,
      defval: '',
    });
    
    return parsed;
  }
}

