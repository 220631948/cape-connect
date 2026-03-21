import type {DomainMode} from '@/hooks/useDomainState';

interface DashboardStatusIndicatorProps {
    mode: DomainMode;
    role?: string;
}

const modeIndicatorClassNames: Record<DomainMode, string> = {
    general: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]',
    emergency: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]',
    environmental: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]',
    citizens: 'bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]',
    farmers: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]',
};

export default function DashboardStatusIndicator({mode, role}: DashboardStatusIndicatorProps) {
    return (
        <div
            className="mb-6 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <div className={`h-3 w-3 animate-pulse rounded-full ${modeIndicatorClassNames[mode]}`}/>
                <div>
                    <h1 className="text-xl font-black leading-none tracking-tighter text-white uppercase italic">
                        {mode.toUpperCase()} MODE
                    </h1>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-400">
                        Role: {role || 'General Operator'} • System: 2026-METRO-V1
                    </p>
                </div>
            </div>
            <div className="hidden gap-6 sm:flex">
                <div className="text-right">
                    <div className="text-[10px] uppercase text-gray-500">Latency</div>
                    <div className="text-xs font-mono text-emerald-400">12ms</div>
                </div>
                <div className="border-l border-white/10 pl-6 text-right">
                    <div className="text-[10px] uppercase text-gray-500">Tenant</div>
                    <div className="text-xs font-mono text-blue-400">CAPETOWN-CORE</div>
                </div>
            </div>
        </div>
    );
}
