import { Link, Outlet, useLocation } from 'react-router';
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';
import { AppSidebar, currentPathInfo } from './components/app-sidebar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from './components/ui/breadcrumb';
import { useState } from 'react';
import { Button } from './components/ui/button';

export default function Root() {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const pathInfo = currentPathInfo(location.pathname);

    return (
        <SidebarProvider open={sidebarOpen}>
            <AppSidebar />
            <div>
                <div className="z-30 absolute text-white flex items-center flex-row gap-2">
                    <SidebarTrigger onClick={() => setSidebarOpen(!sidebarOpen)} />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Button
                                        variant="link"
                                        className="cursor-pointer no-underline hover:no-underline text-muted-foreground hover:text-white"
                                        onClick={() => setSidebarOpen(!sidebarOpen)}
                                    >
                                        Flux Web Demos
                                    </Button>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            {pathInfo && (
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link className="cursor-pointer hover:text-white" to={pathInfo.path}>
                                            {pathInfo.title}
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            )}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>
            <main>
                <Outlet />
            </main>
        </SidebarProvider>
    );
}
