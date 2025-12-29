import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatTokenAmount } from '../../utils/format';

interface VotingChartProps {
    votesFor: string;
    votesAgainst: string;
    votesAbstain: string;
}

const COLORS = {
    for: '#22c55e',
    against: '#ef4444',
    abstain: '#6b7280',
};

export function VotingChart({ votesFor, votesAgainst, votesAbstain }: VotingChartProps) {
    const forNum = Number(BigInt(votesFor) / BigInt(10 ** 18));
    const againstNum = Number(BigInt(votesAgainst) / BigInt(10 ** 18));
    const abstainNum = Number(BigInt(votesAbstain) / BigInt(10 ** 18));

    const total = forNum + againstNum + abstainNum;

    if (total === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🗳️</div>
                <div className="empty-state-title">No votes yet</div>
            </div>
        );
    }

    const data = [
        { name: 'For', value: forNum, color: COLORS.for },
        { name: 'Against', value: againstNum, color: COLORS.against },
        { name: 'Abstain', value: abstainNum, color: COLORS.abstain },
    ].filter((d) => d.value > 0);

    const renderCustomLabel = ({ percent }: { percent?: number }) => {
        if (!percent || percent < 0.05) return null;
        return `${(percent * 100).toFixed(0)}%`;
    };

    return (
        <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={renderCustomLabel}
                        labelLine={false}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value) => formatTokenAmount(BigInt(Number(value)) * BigInt(10 ** 18))}
                        contentStyle={{
                            background: 'rgba(18, 18, 26, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                        }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        formatter={(value: string) => (
                            <span style={{ color: '#a0a0b0', fontSize: '14px' }}>{value}</span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
