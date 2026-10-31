"use strict";

async function startApp() {
    try {
        await authService.init();
        const { data: { session } } = await window.sbClient.auth.getSession();
        let oauthReturn = false;
        try { oauthReturn = sessionStorage.getItem('oauthRole') === 'traveller'; } catch (_) {}
        if (oauthReturn && session?.user) await finishGoogleLogin(session.user);
        await refreshAuth();
        const me = authState.user;
        const path = location.hash.slice(1).split('?')[0];
        if (me && (oauthReturn || path === '/login' || path === '/signup')) {
            let next;
            try { next = sessionStorage.getItem('postLoginPath'); sessionStorage.removeItem('postLoginPath'); sessionStorage.removeItem('oauthRole'); } catch (_) {}
            const target = next && /^\/(?!\/)/.test(next) && !/^\/(login|signup|organizer|traveller)(\/|\?|$)/.test(next)
                ? next : me.role === 'ORGANIZER' ? '/organizer/dashboard' : '/traveller/dashboard';
            history.replaceState(null, '', location.pathname + location.search + '#' + target);
        }
        await dataService.loadIntoStore().catch(() => {});
    } catch (error) {
        console.error('Startup failed:', error);
        await refreshAuth(null);
    } finally {
        window.authBooting = false;
        ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
    }
}
startApp();
