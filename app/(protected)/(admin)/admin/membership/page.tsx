import MembershipList from "./membership-list";
import { Content } from "@/components/layouts/crm/components/content";

export default function SubscriptionsPage() {
    return (
        <>
            <Content className="block p-6">
                <MembershipList />
            </Content>
        </>
    );
}
