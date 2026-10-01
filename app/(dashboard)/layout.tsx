import { Sidebar } from "@/components/sidebar";
import { WatchlistProvider } from "@/context/watchlist-context";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <WatchlistProvider>
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <Sidebar />
        <div className="min-w-0 flex-1 pt-14 md:pt-0">{children}</div>
      </div>
    </WatchlistProvider>
  );
}