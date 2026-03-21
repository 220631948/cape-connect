import {CrayonCard} from '../ui/CrayonCard';
import type {Theme, ThemeName} from '../../assets/tokens/themes';
import AnalyticsDashboard from '../analysis/AnalyticsDashboard';
import {DomainSidebar} from './DomainSidebar';
import QuickActionsCard from './QuickActionsCard';

interface DashboardSidebarProps {
    colors: Theme;
    mode: string;
    theme: ThemeName;
    showDraw: boolean;
    showFlights: boolean;
    onToggleDraw: () => void;
    onToggleFlights: () => void;
}

export default function DashboardSidebar({
                                             colors,
                                             mode,
                                             theme,
                                             showDraw,
                                             showFlights,
                                             onToggleDraw,
                                             onToggleFlights
                                         }: DashboardSidebarProps) {
    return (
        <div className="flex flex-col gap-6 lg:col-span-1">
            <DomainSidebar colors={colors}/>

            <CrayonCard colorVariant="blue" className="flex flex-1 flex-col p-5">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
                        {mode === 'general' ? '🗺️ Layer Intelligence' : '🛠️ Domain Overrides'}
                    </h2>
                </div>
                <div className="min-h-[250px] flex-1">
                    <AnalyticsDashboard guestMode={theme === 'light'}/>
                </div>
            </CrayonCard>

            <QuickActionsCard
                showDraw={showDraw}
                showFlights={showFlights}
                onToggleDraw={onToggleDraw}
                onToggleFlights={onToggleFlights}
            />
        </div>
    );
}
