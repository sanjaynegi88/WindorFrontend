'use client';

export function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-[32px]">
      {[1, 2].map((s) => (
        <div key={s} className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-[16px] font-bold font-asap transition-colors ${
              s === step
                ? 'bg-[#1CA7A6] text-white'
                : s < step
                  ? 'bg-[#1CA7A6]/40 text-white'
                  : 'bg-[rgba(112,128,144,0.2)] text-[#708090]'
            }`}
          >
            {s}
          </div>
          {s < 2 && (
            <div
              className={`w-16 h-[2px] rounded transition-colors ${
                step > 1 ? 'bg-[#1CA7A6]' : 'bg-[rgba(112,128,144,0.2)]'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
