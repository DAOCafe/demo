import { formatTokenAmount } from '../../utils/format';

interface VoteProgressProps {
    forVotes: string;
    againstVotes: string;
    abstainVotes: string;
}

export function VoteProgress({ forVotes, againstVotes, abstainVotes }: VoteProgressProps) {
    const forNum = Number(BigInt(forVotes) / BigInt(10 ** 18));
    const againstNum = Number(BigInt(againstVotes) / BigInt(10 ** 18));
    const abstainNum = Number(BigInt(abstainVotes) / BigInt(10 ** 18));

    const total = forNum + againstNum + abstainNum;

    const forPercent = total > 0 ? (forNum / total) * 100 : 0;
    const againstPercent = total > 0 ? (againstNum / total) * 100 : 0;
    const abstainPercent = total > 0 ? (abstainNum / total) * 100 : 0;

    return (
        <div className="vote-progress">
            <div className="vote-progress-bar">
                <div className="vote-progress-for" style={{ width: `${forPercent}%` }} />
                <div className="vote-progress-against" style={{ width: `${againstPercent}%` }} />
                <div className="vote-progress-abstain" style={{ width: `${abstainPercent}%` }} />
            </div>
            <div className="vote-progress-labels">
                <div className="vote-progress-label">
                    <span className="vote-progress-label-dot for" />
                    <span>For: {formatTokenAmount(forVotes)}</span>
                </div>
                <div className="vote-progress-label">
                    <span className="vote-progress-label-dot against" />
                    <span>Against: {formatTokenAmount(againstVotes)}</span>
                </div>
                <div className="vote-progress-label">
                    <span className="vote-progress-label-dot abstain" />
                    <span>Abstain: {formatTokenAmount(abstainVotes)}</span>
                </div>
            </div>
        </div>
    );
}
