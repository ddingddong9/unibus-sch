import AdminLayout from "./AdminLayout";
import Campus3DPage from "../campus3d/Campus3DPage";

export default function Campus3DManagement() {
  return (
    <AdminLayout>
      <div className="h-full min-h-[640px] overflow-hidden">
        <Campus3DPage embedded />
      </div>
    </AdminLayout>
  );
}
