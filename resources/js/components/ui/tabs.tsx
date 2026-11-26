import * as React from 'react';

import { cn } from '@/lib/utils';

const TabsContext = React.createContext<{
    value: string;
    onValueChange: (value: string) => void;
} | null>(null);

function useTabs() {
    const context = React.useContext(TabsContext);
    if (!context) {
        throw new Error('useTabs must be used within a Tabs component.');
    }
    return context;
}

const Tabs = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<'div'> & {
        defaultValue?: string;
    }
>(({ className, children, defaultValue = '', ...props }, ref) => {
    const [value, setValue] = React.useState(defaultValue);

    return (
        <TabsContext.Provider value={{ value, onValueChange: setValue }}>
            <div ref={ref} className={cn(className)} {...props}>
                {children}
            </div>
        </TabsContext.Provider>
    );
});
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<'div'>
>(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
            className,
        )}
        {...props}
    >
        {children}
    </div>
));
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ComponentProps<'button'> & {
        value: string;
    }
>(({ className, value, children, ...props }, ref) => {
    const { value: activeValue, onValueChange } = useTabs();

    return (
        <button
            ref={ref}
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-muted-foreground data-[state=active]:shadow-sm',
                className,
            )}
            data-state={activeValue === value ? 'active' : 'inactive'}
            onClick={() => onValueChange(value)}
            {...props}
        >
            {children}
        </button>
    );
});
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<'div'> & {
        value: string;
    }
>(({ className, value, children, ...props }, ref) => {
    const { value: activeValue } = useTabs();

    if (activeValue !== value) {
        return null;
    }

    return (
        <div
            ref={ref}
            className={cn('mt-2 ring-offset-background focus:outline-none', className)}
            {...props}
        >
            {children}
        </div>
    );
});
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
