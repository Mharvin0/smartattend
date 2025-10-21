import React from 'react';

class ApplicationLogo extends React.Component {
    render() {
        const { className } = this.props;
        return (
            <div className={className}>
                <img 
                    src="/images/smartattend-logo-modern.svg" 
                    alt="SmartAttend - Attendance Management System" 
                    className="h-full w-full object-contain"
                />
            </div>
        );
    }
}

export default ApplicationLogo;