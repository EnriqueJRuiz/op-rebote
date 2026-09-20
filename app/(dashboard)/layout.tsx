import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="min-w-0 flex-1 pt-14 md:pt-0">{children}</div>
    </div>
  );
}