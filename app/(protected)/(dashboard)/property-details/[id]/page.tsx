import { notFound } from "next/navigation";
import { Content } from "@/components/layouts/crm/components/content";
import ComponentDetail from "./component-detail";
import { getPropertyById } from "@/lib/actions";

interface ComponentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ComponentDetailPage({
  params,
}: ComponentDetailPageProps) {
  const { id } = await params;

  const res = await getPropertyById(id);

  if (!res || !res.success || !res.data) {
    notFound();
  }

  return (
    <Content className="block py-0">
      <ComponentDetail componentId={id} componentData={res.data?.data ?? res.data} />
    </Content>
  );
}
