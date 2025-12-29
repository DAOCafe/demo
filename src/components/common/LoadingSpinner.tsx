interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
}

export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
    const sizeMap = {
        sm: '20px',
        md: '32px',
        lg: '48px',
    };

    return (
        <div className="loading-container">
            <div
                className="loading-spinner"
                style={{ width: sizeMap[size], height: sizeMap[size] }}
            />
            {message && <p>{message}</p>}
        </div>
    );
}
