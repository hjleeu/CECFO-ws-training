import { AdminGate } from "@/components/admin/AdminGate";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
    return <AdminGate>{children}</AdminGate>
}