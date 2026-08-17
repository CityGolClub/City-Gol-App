import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import * as XLSX from "xlsx";

import { requireAdminApiSession } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { jsonError } from "@/lib/utils/http";
import { teamMembers, teams, users } from "@drizzle/schema";

export async function GET(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) return jsonError(auth.message, auth.status);

  const db = getDb();
  const url = new URL(request.url);
  const teamId = url.searchParams.get("teamId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const activeOnly = url.searchParams.get("activeOnly") !== "false";

  const conditions = [
    teamId ? eq(teams.id, teamId) : undefined,
    activeOnly ? eq(users.isActive, true) : undefined,
    from ? gte(users.createdAt, new Date(from)) : undefined,
    to ? lte(users.createdAt, new Date(to)) : undefined,
  ];

  const items = await db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      birthDate: users.birthDate,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      scoreTotal: users.scoreTotal,
      scoreMonthly: users.scoreMonthly,
      scoreVigente: users.scoreVigente,
      teamName: teams.name,
    })
    .from(users)
    .leftJoin(teamMembers, and(eq(teamMembers.userId, users.id), eq(teamMembers.isActive, true)))
    .leftJoin(teams, and(eq(teamMembers.teamId, teams.id), eq(teams.isActive, true)))
    .where(and(...conditions))
    .orderBy(desc(users.createdAt), asc(users.firstName), asc(users.lastName));

  const rows = items.map((item) => ({
    Nombre: item.firstName,
    Apellido: item.lastName,
    Email: item.email,
    Telefono: item.phone,
    "Fecha de nacimiento": item.birthDate,
    Rol: item.role,
    Estado: item.isActive ? "Activo" : "Inactivo",
    Equipo: item.teamName ?? "Sin asignar",
    "Score total": item.scoreTotal,
    "Score mensual": item.scoreMonthly,
    "Score vigente": item.scoreVigente,
    "Fecha de registro": item.createdAt.toISOString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="citygol-usuarios.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
