"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = App;
var react_1 = require("react");
var material_1 = require("@mui/material");
var styles_1 = require("@mui/material/styles");
var Header_1 = require("./components/Header");
var AnalyticsPanel_1 = require("./components/Analytics/AnalyticsPanel");
var ReportsPage_1 = require("./components/Analytics/ReportsPage");
var ProfileEditPage_1 = require("./components/Analytics/ProfileEditPage");
var ScraperEditPage_1 = require("./components/Sources/ScraperEditPage");
var JobsList_1 = require("./components/Jobs/JobsList");
var SourcesPanel_1 = require("./components/Sources/SourcesPanel");
function ReportsRouterView() {
    var _a = react_1.default.useState(null), profileId = _a[0], setProfileId = _a[1];
    var _b = react_1.default.useState(undefined), profileName = _b[0], setProfileName = _b[1];
    react_1.default.useEffect(function () {
        var h = (typeof window !== 'undefined' && window.location
            ? window.location.hash
            : '') || '';
        // Accept formats: #/reports?profileId=123 or #/reports/123
        var id = null;
        if (h.startsWith('#/reports/')) {
            var tail = h.substring('#/reports/'.length);
            var n = Number(tail.split(/[?#]/)[0]);
            if (Number.isFinite(n))
                id = n;
        }
        else if (h.startsWith('#/reports')) {
            var m = h.match(/profileId=(\d+)/);
            if (m && m[1]) {
                var n = Number(m[1]);
                if (Number.isFinite(n))
                    id = n;
            }
        }
        setProfileId(id);
        // Optionally, can parse profileName from hash too, e.g., &name=...
        var mName = h.match(/name=([^&#]+)/);
        if (mName && mName[1])
            try {
                setProfileName(decodeURIComponent(mName[1]));
            }
            catch (_a) { }
    }, []);
    var onBack = react_1.default.useCallback(function () {
        window.history.back();
    }, []);
    if (!profileId) {
        return (<material_1.Typography variant="body2" color="error">
        Не указан profileId
      </material_1.Typography>);
    }
    return (<ReportsPage_1.ReportsPage profileId={profileId} profileName={profileName} onBack={onBack}/>);
}
function ProfileRouterView() {
    var _a = react_1.default.useState(undefined), id = _a[0], setId = _a[1];
    react_1.default.useEffect(function () {
        var h = (typeof window !== 'undefined' && window.location
            ? window.location.hash
            : '') || '';
        if (h === '#/profile/new') {
            setId(undefined);
        }
        else if (h.startsWith('#/profile/')) {
            var tail = h.substring('#/profile/'.length);
            var n = Number(tail.split(/[?#]/)[0]);
            if (Number.isFinite(n))
                setId(n);
        }
    }, []);
    var onBack = react_1.default.useCallback(function () {
        window.history.back();
    }, []);
    return <ProfileEditPage_1.ProfileEditPage id={id} onBack={onBack}/>;
}
function ScraperRouterView() {
    var _a = react_1.default.useState(undefined), id = _a[0], setId = _a[1];
    react_1.default.useEffect(function () {
        var h = (typeof window !== 'undefined' && window.location
            ? window.location.hash
            : '') || '';
        if (h === '#/scraper/new') {
            setId(undefined);
        }
        else if (h.startsWith('#/scraper/')) {
            var tail = h.substring('#/scraper/'.length);
            var idStr = tail.split(/[?#]/)[0];
            if (idStr)
                setId(idStr);
        }
    }, []);
    var onBack = react_1.default.useCallback(function () {
        window.history.back();
    }, []);
    return <ScraperEditPage_1.ScraperEditPage id={id} onBack={onBack}/>;
}
var theme = (0, styles_1.createTheme)({
    palette: {
        mode: 'dark',
        background: { default: '#0f172a', paper: '#111827' },
    },
});
function App() {
    var useState = react_1.default.useState;
    var useEffect = react_1.default.useEffect;
    var _a = useState(function () {
        if (typeof window !== 'undefined' && window.location) {
            var h = window.location.hash;
            if (h === '#/jobs')
                return 'jobs';
            if (h === '#/analytics')
                return 'analytics';
            if (h === '#/sources')
                return 'sources';
            if (h.startsWith('#/reports'))
                return 'reports';
            if (h.startsWith('#/profile'))
                return 'profile';
            if (h.startsWith('#/scraper'))
                return 'scraper';
        }
        return 'analytics';
    }), route = _a[0], setRoute = _a[1];
    useEffect(function () {
        var onHash = function () {
            var h = window.location.hash;
            if (h === '#/jobs')
                setRoute('jobs');
            else if (h === '#/analytics')
                setRoute('analytics');
            else if (h === '#/sources')
                setRoute('sources');
            else if (h.startsWith('#/reports'))
                setRoute('reports');
            else if (h.startsWith('#/profile'))
                setRoute('profile');
            else if (h.startsWith('#/scraper'))
                setRoute('scraper');
            else
                setRoute('analytics');
        };
        window.addEventListener('hashchange', onHash);
        return function () { return window.removeEventListener('hashchange', onHash); };
    }, []);
    return (<styles_1.ThemeProvider theme={theme}>
      <material_1.CssBaseline />
      <Header_1.Header activeRoute={route} onNavigate={function (r) {
            if (r === 'jobs')
                window.location.hash = '#/jobs';
            else if (r === 'analytics')
                window.location.hash = '#/analytics';
            else if (r === 'sources')
                window.location.hash = '#/sources';
            else
                window.location.hash = '#/analytics';
        }}/>

      <material_1.Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        {route === 'jobs' ? (<JobsList_1.JobsList />) : route === 'analytics' ? (<AnalyticsPanel_1.AnalyticsPanel />) : route === 'sources' ? (<SourcesPanel_1.SourcesPanel />) : route === 'reports' ? (<material_1.Card>
            <material_1.CardHeader title="Аналитика"/>
            <material_1.CardContent>
              <ReportsRouterView />
            </material_1.CardContent>
          </material_1.Card>) : route === 'profile' ? (<material_1.Card>
            <material_1.CardHeader title="Аналитика"/>
            <material_1.CardContent>
              <ProfileRouterView />
            </material_1.CardContent>
          </material_1.Card>) : route === 'scraper' ? (<material_1.Card>
            <material_1.CardHeader title="Источники"/>
            <material_1.CardContent>
              <ScraperRouterView />
            </material_1.CardContent>
          </material_1.Card>) : (<AnalyticsPanel_1.AnalyticsPanel />)}
      </material_1.Container>
    </styles_1.ThemeProvider>);
}
