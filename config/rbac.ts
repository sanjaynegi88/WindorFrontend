export type Role = 'property_owner' | 'city_inspector' | 'insurance_company' | 'admin' | 'contractor' | 'manufacturer' | 'realtor' | 'guest';

export interface RouteConfig {
    path: string;
    allowedRoles: Role[] | 'all';
    mainAccountOnly?: boolean;
}

export const guestOnlyRoutes = ['/select-role'];

export const RBAC_CONFIG: RouteConfig[] = [
    // Shared Routes
    { path: '/dashboard', allowedRoles: 'all' },
    { path: '/notifications', allowedRoles: 'all' },
    { path: '/plans', allowedRoles: 'all', mainAccountOnly: true },
    { path: '/reports', allowedRoles: 'all' },
    { path: '/property-details', allowedRoles: 'all' },
    { path: '/added-properties', allowedRoles: 'all' },
    { path: '/properties', allowedRoles: ['contractor', 'admin', 'property_owner', 'manufacturer'] },
    { path: '/properties/new', allowedRoles: ['contractor', 'admin', 'property_owner', 'manufacturer'] },
    { path: '/properties/edit', allowedRoles: ['contractor', 'admin', 'property_owner', 'manufacturer'] },
    { path: '/properties/add-property', allowedRoles: ['contractor', 'admin', 'property_owner', 'manufacturer'] },
    { path: '/profile-setup', allowedRoles: ['contractor', 'admin'] },
    { path: '/contractor-users', allowedRoles: ['contractor'], mainAccountOnly: true },
    { path: '/contractor-users/add-user', allowedRoles: ['contractor'], mainAccountOnly: true },
    { path: '/contractor-users/edit-user', allowedRoles: ['contractor'], mainAccountOnly: true },

    // City Inspector Routes
    { path: '/verification', allowedRoles: ['city_inspector', 'admin'] },
    { path: '/city-users', allowedRoles: ['city_inspector'], mainAccountOnly: true },
    { path: '/city-users/add-user', allowedRoles: ['city_inspector'], mainAccountOnly: true },
    { path: '/city-users/edit-user', allowedRoles: ['city_inspector'], mainAccountOnly: true },
    { path: '/city-logs', allowedRoles: ['city_inspector'], mainAccountOnly: true },

    // Insurance Company Routes
    { path: '/company-users', allowedRoles: ['insurance_company'], mainAccountOnly: true },
    { path: '/company-users/add-user', allowedRoles: ['insurance_company'], mainAccountOnly: true },
    { path: '/company-users/edit-user', allowedRoles: ['insurance_company'], mainAccountOnly: true },
    { path: '/company-logs', allowedRoles: ['insurance_company'], mainAccountOnly: true },

    // Admin Routes
    { path: '/admin', allowedRoles: ['admin'] },
    { path: '/admin/users', allowedRoles: ['admin'] },
    { path: '/admin/users/edit-user', allowedRoles: ['admin'] },
    { path: '/admin/users/add-user', allowedRoles: ['admin'] },
    { path: '/admin/city', allowedRoles: ['admin'] },
    { path: '/admin/brands', allowedRoles: ['admin'] },
    { path: '/admin/subscriptions', allowedRoles: ['admin'] },
    { path: '/admin/companies', allowedRoles: ['admin'] },
    { path: '/admin/states', allowedRoles: ['admin'] },
    { path: '/admin/roles', allowedRoles: ['admin'] },
    { path: '/admin/components', allowedRoles: ['admin'] },
    { path: '/admin/property-types', allowedRoles: ['admin'] }
];

export const publicRoutes = [
    '/',
    '/home',
    '/about-us',
    '/services',
    '/pricing',
    '/plans',
    '/contact',
    '/faq',
    '/resources',
    '/careers',
    '/documentation',
    '/verification-services',
    '/verification',
    '/reporting',
    '/home-owner',
    '/insurance-companies',
    '/city-inspectors',
    '/contractor',
    '/realtors',
    '/distributors',
    '/manufacturers',
    '/login',
    '/register',
    '/forgot-password',
    '/verify-otp',
    '/reset-password',
    '/set-password',
    '/subscription/success',
    '/subscription/cancel',
    '/subscription/failure',
    '/purchase/success',
    '/purchase/cancel',
    '/purchase/failed',
    '/contractors'
];

export function canAccess(role: Role, path: string): boolean {
    const routePattern = RBAC_CONFIG.find(config => {
        if (config.path === path) return true;
        if (path.startsWith(config.path + '/')) return true;
        return false;
    });

    if (routePattern) {
        if (routePattern.allowedRoles === 'all') return true;
        return routePattern.allowedRoles.includes(role);
    }

    if (path === '/' || publicRoutes.some(route => route === '/' ? path === '/' : (path === route || path.startsWith(route + '/')))) {
        return true;
    }

    return false;
}
