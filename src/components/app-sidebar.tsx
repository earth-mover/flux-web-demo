import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Earth, Github } from 'lucide-react';
import { Link } from 'react-router';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';

const DEMOS = [
    {
        icon: <Earth />,
        title: 'GFS Globe',
        path: '/gfs-globe',
        description:
            'An interactive MaplibreGL Globe displaying GFS Temperature and Wind data. Click on the globe to view the timeseries of the temperature at the selected location.',
        tags: ['WMS', 'EDR', 'MapLibre', 'DeckGL'],
    },
];

export function currentPathInfo(path: string) {
    const pathInfo = DEMOS.find((demo) => demo.path === path);
    return pathInfo;
}

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarContent className="flex flex-col justify-between">
                <div>
                    <SidebarHeader>
                        <div className="flex flex-row items-center gap-2">
                            <img src="/favicon.svg" alt="Flux Logo" className="h-6" />
                            <h1 className="font-bold">Flux Demos</h1>
                        </div>
                        <Separator className="my-2" />
                    </SidebarHeader>
                    {DEMOS.map(({ title, path, icon, description, tags }) => {
                        return (
                            <Tooltip key={path}>
                                <TooltipTrigger className="w-full">
                                    <SidebarMenu key={path}>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton asChild>
                                                <Link to={path}>
                                                    <div className="flex flex-row items-center gap-2">
                                                        {icon}
                                                        {title}
                                                    </div>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    </SidebarMenu>
                                </TooltipTrigger>
                                <TooltipContent className="text-white w-64 text-wrap">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm">{description}</p>
                                        <div className="flex flex-row gap-2 flex-wrap">
                                            {tags.map((tag) => (
                                                <Badge key={tag} variant="outline" className="text-xs text-white bg-[var(--dark-violet)]">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        );  
                    })}
                </div>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu className="flex flex-col my-8 gap-2">
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild className="flex flex-row items-center gap-2">
                            <Link
                                to="https://github.com/earth-mover/flux-web-demos"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <div className="flex flex-row items-center bg-black rounded-full p-1">
                                    <Github color="white" size={16} fill="white" />
                                </div>
                                <span>Fork on GitHub</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild className="flex flex-row items-center gap-2">
                            <Link
                                to="https://earthmover.io/blog/announcing-flux"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img src="/favicon.svg" alt="Flux Logo" className="h-6" />
                                <span>Learn More About Flux</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <span className="text-sm text-muted-foreground">
                            Copyright © 2025{' '}
                            <a
                                href="https://earthmover.io"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--violet)]"
                            >
                                Earthmover
                            </a>
                        </span>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
