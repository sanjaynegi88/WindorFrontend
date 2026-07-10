import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RBAC_CONFIG, publicRoutes, guestOnlyRoutes, Role } from './config/rbac';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let userRole = request.cookies.get('user-role')?.value as Role | undefined;
  let authToken = request.cookies.get('auth-token')?.value;
  const refreshToken = request.cookies.get('refresh-token')?.value;
  let isSubUser = request.cookies.get('sub-account')?.value === 'true';
  let hasMembership = request.cookies.get('has-membership')?.value === 'true';

  let cookiesUpdated = false;
  let newCookies: Record<string, string> = {};

  const loginUrl = process.env.NEXT_PUBLIC_LOGIN_URL || '/login';

  // Check if we need to refresh the session
  const hasMetadataCookie = request.cookies.has('user-role') && request.cookies.has('has-membership');
  const needsRefresh = refreshToken && (!authToken || !userRole || !hasMetadataCookie);

  if (needsRefresh) {
    try {
      const API_URL = process.env.NEXT_PUBLIC_BASE_URL;
      const refreshRes = await fetch(`${API_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!refreshRes.ok) {
        // Clear cookies and redirect to login to avoid loops
        const response = NextResponse.redirect(new URL(loginUrl, request.url));
        response.cookies.delete('auth-token');
        response.cookies.delete('refresh-token');
        response.cookies.delete('user-role');
        response.cookies.delete('sub-account');
        response.cookies.delete('has-membership');
        return response;
      }

      const refreshData = await refreshRes.json();
      const idToken = refreshData.tokens.idToken;
      const rotatedRefreshToken = refreshData.tokens.refreshToken || refreshToken;

      // Fetch user profile using the new idToken
      const profileRes = await fetch(`${API_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const userProfile = profileData.data || profileData;
        const role = (userProfile.role ? userProfile.role.toLowerCase() : null) || userRole || 'guest';
        const subAccount = String(userProfile.sub_account ?? isSubUser);
        const membershipValue = String(userProfile.has_membership ?? hasMembership);

        authToken = idToken;
        userRole = role as Role;
        isSubUser = subAccount === 'true';
        hasMembership = membershipValue === 'true';

        newCookies = {
          'auth-token': idToken,
          'refresh-token': rotatedRefreshToken,
          'user-role': role,
          'sub-account': subAccount,
          'has-membership': membershipValue,
        };
        cookiesUpdated = true;
      } else {
        // Profile fetch failed, clear cookies and redirect
        const response = NextResponse.redirect(new URL(loginUrl, request.url));
        response.cookies.delete('auth-token');
        response.cookies.delete('refresh-token');
        response.cookies.delete('user-role');
        response.cookies.delete('sub-account');
        response.cookies.delete('has-membership');
        return response;
      }
    } catch (err) {
      console.error('Error refreshing token in middleware:', err);
    }
  }

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const hasSession = authToken || refreshToken;

  const authOnlyRoutes = [loginUrl, '/register', '/login', '/forgot-password', '/verify-otp', '/reset-password'];
  const isAuthOnlyRoute = authOnlyRoutes.some(route => pathname.startsWith(route));

  const getResponse = (targetUrl?: string) => {
    const res = targetUrl
      ? NextResponse.redirect(new URL(targetUrl, request.url))
      : NextResponse.next();

    if (cookiesUpdated) {
      const isProd = process.env.NODE_ENV === 'production';
      res.cookies.set('auth-token', newCookies['auth-token'], {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
      });
      res.cookies.set('refresh-token', newCookies['refresh-token'], {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
      });
      res.cookies.set('user-role', newCookies['user-role'], {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
      });
      res.cookies.set('sub-account', newCookies['sub-account'], {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
      });
      res.cookies.set('has-membership', newCookies['has-membership'], {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
      });
    }
    return res;
  };

  if (hasSession && isAuthOnlyRoute) {
    if (userRole === 'guest') {
      return getResponse('/select-role');
    }
    return getResponse('/dashboard');
  }

  if (!hasSession && !isPublicRoute) {
    return getResponse(loginUrl);
  }

  if (hasSession && userRole === 'guest') {
    const isSelectRoleRoute = guestOnlyRoutes.some(route => pathname.startsWith(route));
    if (!isSelectRoleRoute) {
      return getResponse('/select-role');
    }
    return getResponse();
  }

  if (hasSession && userRole !== 'guest' && pathname.startsWith('/select-role')) {
    return getResponse('/dashboard');
  }

  if (hasSession && !hasMembership && !isPublicRoute &&
    !pathname.startsWith('/plans') &&
    !pathname.startsWith('/subscription/') &&
    !pathname.startsWith('/purchase/') &&
    !pathname.startsWith('/profile') &&
    !pathname.startsWith('/profile-setup') &&
    !pathname.startsWith('/change-password') &&
    !pathname.startsWith('/property-details') &&
    userRole !== 'admin' &&
    userRole !== 'city_inspector' &&
    !(userRole === 'insurance_company' && isSubUser) &&
    !(userRole === 'contractor' && isSubUser)
  ) {
    return getResponse('/plans');
  }

  // RBAC check
  if (hasSession && userRole) {
    const pathWithoutQuery = pathname.split('?')[0];

    const routeConfig = RBAC_CONFIG.find(config => {
      if (config.path === pathWithoutQuery) return true;
      if (pathWithoutQuery.startsWith(config.path + '/')) return true;
      return false;
    });

    if (routeConfig) {
      const isAllowedRole = routeConfig.allowedRoles === 'all' || routeConfig.allowedRoles.includes(userRole);
      const isSubAccount = request.cookies.get('sub-account')?.value === 'true';
      const satisfiesMainAccountRequirement = !routeConfig.mainAccountOnly || !isSubAccount;

      if (!isAllowedRole || !satisfiesMainAccountRequirement) {
        return getResponse('/dashboard');
      }
    }
  }

  return getResponse();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.png$).*)',
  ],
};
