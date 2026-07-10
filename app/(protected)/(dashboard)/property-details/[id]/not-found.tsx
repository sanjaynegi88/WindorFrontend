import Link from 'next/link';
import { Content } from '@/components/layouts/crm/components/content';

export default function NotFound() {
  return (
    <Content className="block py-0">
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center space-y-4">
          <h1 className="text-[48px] md:text-[72px] font-bold text-[#1F2A44] font-asap">404</h1>
          <p className="text-[18px] md:text-[24px] font-semibold text-[#708090] font-asap">
            Property not found
          </p>
          <p className="text-[14px] md:text-[16px] text-[#708090] font-asap">
            The property you're looking for doesn't exist or has been removed.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-[16px] font-bold text-[#1CA7A6] hover:underline font-asap uppercase tracking-wide"
        >
          Back to Dashboard
        </Link>
      </div>
    </Content>
  );
}
