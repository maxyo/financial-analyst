// Legacy entrypoint now fully delegates to NestJS bootstrap.
// This ensures a single source of truth for HTTP, WebSockets, and Jobs under src/nest.
import './nest/main';
