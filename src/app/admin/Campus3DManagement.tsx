import AdminLayout from "./AdminLayout";
import Campus3DPage from "../campus3d/Campus3DPage";

export default function Campus3DManagement() {
  return (
    <AdminLayout>
      <div className="h-full min-h-[calc(100dvh-65px)] overflow-hidden md:min-h-[640px]">
        <Campus3DPage embedded />
      </div>
    </AdminLayout>
  );
}
