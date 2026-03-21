import {CrayonCard} from '../ui/CrayonCard';

interface QuickActionsCardProps {
    showDraw: boolean;
    showFlights: boolean;
    onToggleDraw: () => void;
    onToggleFlights: () => void;
}

export default function QuickActionsCard({
                                             showDraw,
                                             showFlights,
                                             onToggleDraw,
                                             onToggleFlights
                                         }: QuickActionsCardProps) {
    return (
        <CrayonCard colorVariant="yellow">
            <h2 className="mt-0 text-base font-bold text-white">🚀 Quick Actions</h2>
            <div className="mt-4 flex flex-col gap-2">
                <button onClick={onToggleDraw}
                        className={`cursor-pointer rounded-lg border-2 px-4 py-3 font-semibold transition-all ${showDraw ? 'border-black bg-crayon-yellow text-black' : 'border-crayon-yellow bg-transparent text-crayon-yellow'}`}>
                    {showDraw ? 'Exit Draw Mode' : 'Enter Draw Mode'}
                </button>
                <button onClick={onToggleFlights}
                        className={`cursor-pointer rounded-lg border-2 px-4 py-3 font-semibold transition-all ${showFlights ? 'border-crayon-yellow bg-crayon-yellow text-black' : 'border-crayon-yellow bg-transparent text-crayon-yellow'}`}>
                    {showFlights ? 'Stop Flight Tracking' : 'Start Flight Tracking'}
                </button>
            </div>
        </CrayonCard>
    );
}
