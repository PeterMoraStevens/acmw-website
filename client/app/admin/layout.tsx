import AdminNavbar from "@/components/admin-navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <AdminNavbar />
      <main>{children}</main>
    </div>
  );
}
