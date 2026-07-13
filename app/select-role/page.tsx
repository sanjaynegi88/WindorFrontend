'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { assignUserRole, getRoles, signout } from '@/lib/actions';
import { RoleSelectionPage } from '@/components/register/role-selection-page';
import { cn } from '@/lib/utils';
import { Step2PropertyForm, Step2PropertyValues } from '../register/complete-profile/step2-property-form';
import { Step2ContractorForm, Step2ContractorValues } from '../register/complete-profile/step2-contractor-form';
import Image from 'next/image';

// Roles excluded from self-selection (assigned by admins only)
const EXCLUDED_ROLES = ['ADMIN', 'CITY_INSPECTOR'];

// Role group helpers — same logic as register page
const CONTRACTOR_ROLES = ['CONTRACTOR', 'MANUFACTURER'];
const PROPERTY_ROLES = ['PROPERTY_OWNER', 'REALTOR'];

function getRoleGroup(roleName: string): 'contractor' | 'property' | null {
  if (CONTRACTOR_ROLES.includes(roleName)) return 'contractor';
  if (PROPERTY_ROLES.includes(roleName)) return 'property';
  return null;
}

type RoleOption = {
  id: string;
  role_name: string;
  label: string;
};

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-[32px]">
      {[1, 2].map((s) => (
        <div key={s} className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[16px] font-bold font-asap transition-colors ${s === step ? 'bg-[#1CA7A6] text-white' : s < step ? 'bg-[#1CA7A6]/40 text-white' : 'bg-[rgba(112,128,144,0.2)] text-[#708090]'
            }`}>
            {s}
          </div>
          {s < 2 && (
            <div className={`w-16 h-[2px] rounded transition-colors ${step > 1 ? 'bg-[#1CA7A6]' : 'bg-[rgba(112,128,144,0.2)]'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function SelectRolePage() {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getRoles()
      .then((res) => {
        const filtered: RoleOption[] = (res.data || [])
          .filter((r: { id: string; role_name: string }) => !EXCLUDED_ROLES.includes(r.role_name))
          .map((r: { id: string; role_name: string }) => ({
            id: r.id,
            role_name: r.role_name,
            label: r.role_name
              .split('_')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(' '),
          }));
        setRoles(filtered);
      })
      .catch(() => toast.error('Failed to load roles'))
      .finally(() => setLoadingRoles(false));
  }, []);

  function handleRoleSelect(id: string, name: string) {
    const role = roles.find((item) => item.id === id) ?? null;
    setSelectedRole(role);
    if (!role) return;
    const group = getRoleGroup(name);
    if (group) {
      setStep(2);
      return;
    }
    submitRole({});
  }

  function handleRoleNext() {
    if (!selectedRole) return;
    const group = getRoleGroup(selectedRole.role_name);
    if (group) {
      setStep(2);
    } else {
      submitRole({});
    }
  }

  const handleSignout = async () => {
    await signout();
    window.location.href = process.env.NEXT_PUBLIC_LOGIN_URL || '/login';
  };


  async function submitRole(extraFields: Record<string, any>) {
    if (!selectedRole) return;
    setLoading(true);
    try {
      const response = await assignUserRole(selectedRole.id, selectedRole.role_name, extraFields);
      if (!response.success) {
        toast.error(response.message);
        return;
      }
      toast.success('Role selected successfully. Welcome!');
      await new Promise((r) => setTimeout(r, 100));
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast.error(error.message || 'Failed to set role. Please try again.');
      setLoading(false);
    }
  }

  function handleContractorSubmit(values: Step2ContractorValues) {
    const payload: Record<string, any> = {
      companyAddress: values.companyAddress,
      mobilePhone: values.mobilePhone,
    };
    if (values.websiteUrl) payload.websiteUrl = values.websiteUrl;
    if (values.licenseNumber) payload.licenseNumber = values.licenseNumber;
    if (values.companyPhone) payload.companyPhone = values.companyPhone;
    if (values.city_id) payload.city_id = values.city_id;
    if (values.serviceTypes?.length) payload.serviceTypes = values.serviceTypes;
    submitRole(payload);
  }

  function handlePropertySubmit(values: Step2PropertyValues) {
    const payload: Record<string, any> = {
      propertyAddress: values.propertyAddress,
      mobilePhone: values.mobilePhone,
    };
    if (values.ownerDateStart) payload.ownerDateStart = values.ownerDateStart;
    if (values.ownerDateEnd) payload.ownerDateEnd = values.ownerDateEnd;
    submitRole(payload);
  }

  const roleGroup = selectedRole ? getRoleGroup(selectedRole.role_name) : null;

  return (
    <div
      className={cn(
        "w-full",
        step === 2 &&
        "bg-linear-to-b from-white to-[#1ccab334]"
      )}
    >
      {step === 2 && (
        <div >
          <div className="flex justify-center mb-8 pt-6">
            <div className="w-[80px] h-[76px] md:w-[100px] md:h-[95px] bg-white shadow-[0px_4px_14px_rgba(31,42,68,0.3)] rounded-[15px] flex items-center justify-center">
              <Image src="/assets/logo.png" alt="Windor Logo" width={75} height={65} priority className="h-[50px] md:h-[65px] w-[55px] md:w-[75px] object-contain" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-[26px] md:text-[36px] font-bold text-[#1F2A44] font-asap uppercase tracking-normal mb-2">
              {`${selectedRole?.label} Details`}
            </h1>
            <p className="text-[15px] md:text-[18px] text-[#708090] font-asap">
              Fill in a few details to complete your profile.
            </p>
          </div>

          <StepIndicator step={step} />
        </div>
      )}

      {/* ── STEP 1: Role selection ── */}
      {step === 1 && (
        <RoleSelectionPage
          roles={roles}
          loadingRoles={loadingRoles}
          onSelect={handleRoleSelect}
        />
      )}

      {/* ── STEP 2: Role-specific fields ── */}
      {step === 2 && roleGroup === 'contractor' && (
        <div className="max-w-2xl  mx-auto  px-4 py-12">
          <Step2ContractorForm
            onBack={() => setStep(1)}
            onSubmit={handleContractorSubmit}
            loading={loading}
          />
        </div>
      )}

      {step === 2 && roleGroup === 'property' && (
        <div className="max-w-2xl   mx-auto   px-4 py-12">
          <Step2PropertyForm
            onBack={() => setStep(1)}
            onSubmit={handlePropertySubmit}
            loading={loading}
          />
        </div>
      )}

      {/* Sign out */}
      <p className="text-center mt-6 pb-6 text-[14px] text-[#708090] font-asap">
        Wrong account?{' '}
        <button type="button" onClick={() => handleSignout()} className="text-[#1CA7A6] font-semibold hover:underline">
          Sign out
        </button>
      </p>
    </div>
  );
}
