import { AuditLog } from "@/models/AuditLog";

export async function writeAudit(input: {
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    await AuditLog.create(input);
  } catch (error) {
    console.error("Audit log gagal:", error);
  }
}
