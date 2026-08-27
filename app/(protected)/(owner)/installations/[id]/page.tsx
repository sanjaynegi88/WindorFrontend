import { Content } from '@/components/layouts/crm/components/content';
import ComponentDetail from './component-detail';
import { getPropertyListUser } from '@/lib/actions';
import { notFound } from 'next/navigation';
import { DetailsPageHeader } from './pageHeader';

interface ComponentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ComponentDetailPage({ params }: ComponentDetailPageProps) {
  // Await params before using
  const { id } = await params;

  // Server-side data fetching
  const result = await getPropertyListUser();

  let componentData = null;

  if (result?.data) {
    for (const property of result.data) {
      if (property.projects && Array.isArray(property.projects)) {
        const matchingProject = property.projects.find(
          (proj: any) => proj.components?.id === id
        );
        if (matchingProject) {
          const comp = matchingProject.components;
          componentData = {
            ...comp,
            propertyId: property.id,
            property: {
              address: property.address,
              city: property.city,
              verified_status: property.verified_status
            }
          };
          break;
        }
      }
    }
  }

  if (!componentData) {
    notFound();
  }

  return (
    <>
      <DetailsPageHeader />
      <Content className="block py-0">
        <ComponentDetail
          componentId={id}
          componentData={componentData}
        />
      </Content>

    </>
  );
}