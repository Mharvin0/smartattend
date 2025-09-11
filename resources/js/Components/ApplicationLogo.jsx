import React from 'react';

class ApplicationLogo extends React.Component {
    render() {
        const { className } = this.props;
        return (
            <div className={className}>
                <div className="flex h-full w-full items-center justify-center rounded-full bg-brand-primary">
                    <span className="text-2xl font-bold text-brand-secondary">UP</span>
                </div>
            </div>
        );
    }
}

export default ApplicationLogo;