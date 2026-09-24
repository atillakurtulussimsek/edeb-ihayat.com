import { requireTeacher } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { TeacherDialog } from "@/components/teachers/teacher-dialog";
import { ProfileDialog } from "@/components/teachers/profile-dialog";
import { TeacherRowActions } from "@/components/teachers/teacher-row-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const metadata = { title: "Öğretmenler" };
export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const me = await requireTeacher();
  const [teachers, meRow] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TEACHER" },
      orderBy: [{ active: "desc" }, { name: "asc" }],
      include: { _count: { select: { students: true, taughtLessons: true } } },
    }),
    prisma.user.findUnique({ where: { id: me.id }, select: { name: true, phone: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Öğretmenler"
        description="Her öğretmen kendi öğrencilerini ve derslerini yönetir."
        actions={
          <>
            <ProfileDialog initial={{ name: meRow?.name ?? me.name, phone: meRow?.phone ?? "" }} />
            <TeacherDialog />
          </>
        }
      />
      <div className="paper-card overflow-hidden rounded-2xl ring-1 ring-foreground/8">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Öğretmen</TableHead>
              <TableHead className="hidden sm:table-cell">Telefon</TableHead>
              <TableHead className="hidden md:table-cell">Öğrenci</TableHead>
              <TableHead className="hidden md:table-cell">Ders</TableHead>
              <TableHead className="hidden md:table-cell">Kayıt</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map((t) => (
              <TableRow key={t.id} className={!t.active ? "opacity-60" : undefined}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {t.name.split(" ").slice(0, 2).map((p) => p[0]?.toLocaleUpperCase("tr")).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 leading-tight">
                      <div className="truncate font-medium">
                        {t.name} {t.id === me.id && <span className="text-xs font-normal text-muted-foreground">(siz)</span>}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{t.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{t.phone ?? "—"}</TableCell>
                <TableCell className="hidden md:table-cell">{t._count.students}</TableCell>
                <TableCell className="hidden md:table-cell">{t._count.taughtLessons}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{fmtDate(t.createdAt)}</TableCell>
                <TableCell>{t.active ? <Badge className="bg-live/15 text-live">Aktif</Badge> : <Badge variant="secondary">Pasif</Badge>}</TableCell>
                <TableCell>{t.id !== me.id && <TeacherRowActions teacher={{ id: t.id, name: t.name, active: t.active }} />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
