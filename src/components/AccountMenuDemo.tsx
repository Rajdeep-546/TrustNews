"use client";

import React from "react";
import AccountMenu from "@/registry/ruixenui/account-menu";

export default function AccountMenuDemo() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-neutral-100 p-6">
      <div className="mb-6">
        <AccountMenu />
      </div>

      <div className="max-w-md text-center text-neutral-400 text-sm space-y-2">
        <p className="font-medium text-neutral-200">
          Professional Dropdown Architecture
        </p>
        <p className="text-neutral-500 text-xs leading-relaxed">
          This menu demonstrates a professional dropdown design with clear
          icon-text spacing, nested submenus, and hover effects. Ideal for
          dashboards, team apps, and admin panels.
        </p>
      </div>
    </div>
  );
}
