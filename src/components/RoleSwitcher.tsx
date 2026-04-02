"use client";

import { useDevRole, DevRole } from "@/context/DevRoleContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RoleSwitcher() {
  const { role, setRole } = useDevRole();

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md">
      <label className="text-sm font-medium text-gray-700">Test Role:</label>
      <Select defaultValue={role} value={role} onValueChange={(value) => setRole(value as DevRole)}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ADMIN">Admin</SelectItem>
          <SelectItem value="MANAGER">Manager</SelectItem>
          <SelectItem value="ENGINEER">Engineer</SelectItem>
          <SelectItem value="CLIENT">Client</SelectItem>

        </SelectContent>
      </Select>
    </div>
  );
}
