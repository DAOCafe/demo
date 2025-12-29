interface StatCardProps {
    label: string;
    value: string | number;
    gradient?: boolean;
}

export function StatCard({ label, value, gradient = false }: StatCardProps) {
    return (
        <div className="stat-card">
            <div className="stat-card-label">{label}</div>
            <div className={`stat-card-value ${gradient ? 'gradient' : ''}`}>
                {value}
            </div>
        </div>
    );
}
