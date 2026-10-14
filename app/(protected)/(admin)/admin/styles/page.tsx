"use client";

import { Content } from "@/components/layouts/crm/components/content";
import StylesListPage from "./style-list";
import { useState } from "react";

export default function StylesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };
  return (
    <>
      <Content className="block p-6">
        <StylesListPage
          refreshTrigger={refreshTrigger}
          onSuccess={handleRefresh}
        />
      </Content>
    </>
  );
}
