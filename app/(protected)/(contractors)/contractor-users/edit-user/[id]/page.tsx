import { use } from "react";
import { EditSubUserForm } from "@/components/sub-accounts/edit-user-form";

export default function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <EditSubUserForm id={id} route="/contractor-users" roleLabel="Contractor" />
  );
}
