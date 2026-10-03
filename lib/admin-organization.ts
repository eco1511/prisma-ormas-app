import { Setting } from "@/models/Setting";
// The current application stores the admin's organization in system settings.
export async function getAdminOrganizationName() {
  const settings = await Setting.findOne({ key: "main" }).select("organizationName").lean<{ organizationName?: string }>();
  return settings?.organizationName?.trim() || "PRISMA";
}
