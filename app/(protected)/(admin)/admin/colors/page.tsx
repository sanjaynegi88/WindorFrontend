"use client";

import { Content } from "@/components/layouts/crm/components/content";
import ColorListPage from "./color-list";
import { useState } from "react";

export default function ColorPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };
  return (
    <>
      <Content className="block p-6">
        <ColorListPage
          refreshTrigger={refreshTrigger}
          onSuccess={handleRefresh}
        />
      </Content>
    </>
  );
}
