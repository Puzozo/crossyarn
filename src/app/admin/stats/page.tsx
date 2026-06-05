import { requireAdminPage } from "@/lib/auth/guards";

export default async function AdminStatsPage() {
  await requireAdminPage();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Статистика</h1>
        <p className="text-gray-400 text-sm mt-1">Буде реалізовано в наступній фазі</p>
      </div>
      <div className="rounded-xl border border-gray-800 border-dashed p-12 text-center text-gray-600">
        Coming soon
      </div>
    </div>
  );
}
