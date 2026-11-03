import { notFound } from "next/navigation";
import { Content } from "@/components/layouts/crm/components/content";
import ComponentDetail from "./component-detail";
import { getPropertyById, getReportUsage } from "@/lib/actions";

interface ComponentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ComponentDetailPage({
  params,
}: ComponentDetailPageProps) {
  const { id } = await params;

  const [res, usageRes] = await Promise.all([
    getPropertyById(id),
    getReportUsage().catch(() => null),
  ]);

  if (!res || !res.success || !res.data) {
    notFound();
  }

  const initialReportUsage = usageRes?.data ?? usageRes ?? null;

  return (
    <Content className="block py-0">
      <ComponentDetail
        componentId={id}
        componentData={res.data?.data ?? res.data}
        initialReportUsage={initialReportUsage}
      />
    </Content>
  );
}
