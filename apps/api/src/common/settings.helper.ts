import { PrismaService } from '../prisma/prisma.service';

/**
 * Read a named business-rule setting from SystemSetting, with a compiled-in
 * default so the system works even before any admin has configured values.
 */
export async function readSetting(
  prisma: PrismaService,
  key: string,
  defaultValue: number,
): Promise<number> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key } });
    if (row) {
      const parsed = parseFloat(row.value);
      if (!isNaN(parsed)) return parsed;
    }
  } catch {}
  return defaultValue;
}
