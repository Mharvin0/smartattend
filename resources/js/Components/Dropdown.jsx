import { Transition } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import { createContext, useContext, useState } from 'react';

const DropDownContext = createContext();

const Dropdown = ({ children }) => {
    const [open, setOpen] = useState(false);

    const toggleOpen = () => {
        setOpen((previousState) => !previousState);
    };

    return (
        <DropDownContext.Provider value={{ open, setOpen, toggleOpen }}>
            <div className="relative z-50">{children}</div>
        </DropDownContext.Provider>
    );
};

const Trigger = ({ children }) => {
    const { open, setOpen, toggleOpen } = useContext(DropDownContext);

    return (
        <>
            <div onClick={toggleOpen}>{children}</div>

            {open && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpen(false)}
                ></div>
            )}
        </>
    );
};

const Content = ({
    align = 'right',
    width = '48',
    contentClasses = 'py-1 bg-white border border-gray-200',
    variant = 'menu', // 'menu' | 'side'
    sideClass = '', // e.g., 'left-72' or 'left-24'
    sideWidthClass = 'w-64',
    children,
}) => {
    const { open, setOpen } = useContext(DropDownContext);

    let alignmentClasses = 'origin-top';

    if (align === 'left') {
        alignmentClasses = 'ltr:origin-top-left rtl:origin-top-right start-0';
    } else if (align === 'right') {
        alignmentClasses = 'ltr:origin-top-right rtl:origin-top-left end-0';
    }

    let widthClasses = '';

    if (width === '48') {
        widthClasses = 'w-48';
    }

    return (
        <>
            {variant === 'side' ? (
                <>
                    {/* Backdrop is already handled by Trigger; keep this in case used standalone */}
                    {open && (
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    )}
                    <Transition
                        show={open}
                        enter="transform transition ease-out duration-200"
                        enterFrom="translate-x-[-8px] opacity-0"
                        enterTo="translate-x-0 opacity-100"
                        leave="transform transition ease-in duration-150"
                        leaveFrom="translate-x-0 opacity-100"
                        leaveTo="translate-x-[-8px] opacity-0"
                    >
                        <div
                            className={`fixed top-0 bottom-0 z-[60] ${sideClass} ${sideWidthClass}`}
                            onClick={() => setOpen(false)}
                        >
                            <div className={`h-full overflow-y-auto bg-white shadow-xl ring-1 ring-black/5 ${contentClasses}`}>
                                {children}
                            </div>
                        </div>
                    </Transition>
                </>
            ) : (
                <Transition
                    show={open}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <div
                        className={`absolute z-[60] mt-2 rounded-md shadow-lg ${alignmentClasses} ${widthClasses}`}
                        onClick={() => setOpen(false)}
                    >
                        <div
                            className={
                                `rounded-md ring-1 ring-black ring-opacity-5 ` +
                                contentClasses
                            }
                        >
                            {children}
                        </div>
                    </div>
                </Transition>
            )}
        </>
    );
};

const DropdownLink = ({ className = '', children, ...props }) => {
    return (
        <Link
            {...props}
            className={
                'block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ' +
                className
            }
        >
            {children}
        </Link>
    );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;

export default Dropdown;
