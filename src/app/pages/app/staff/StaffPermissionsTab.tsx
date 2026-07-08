import React from "react";
import { useParams } from "react-router";
import { ShieldOff } from "lucide-react";
import { getStaff } from "./staffData";

export function StaffPermissionsTab() {
  const { staffId } = useParams();
  const staff = getStaff(staffId);
  if (!staff) return null;

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-10">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <ShieldOff className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">Permissions management coming soon</h2>
      <p className="text-sm text-gray-500 max-w-sm">Granular role and permission controls for {staff.name} will be available here in a future update.</p>
    </div>
  );
}
