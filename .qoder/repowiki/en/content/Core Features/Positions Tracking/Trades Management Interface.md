# Trades Management Interface

<cite>
**Referenced Files in This Document**
- [trades-page.js](file://features/positions/trades-page.js)
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [past-page.js](file://features/positions/past-page.js)
- [trade-modal.js](file://features/common/trade-modal.js)
- [trade-list.js](file://features/common/trade-list.js)
- [trade-sheets.js](file://features/common/trade-sheets.js)
- [BaseRepository.js](file://shared/db/BaseRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)
- [bootstrap.js](file://shared/lib/bootstrap.js)
- [router.js](file://features/common/router.js)
- [app-shell.js](file://features/common/app-shell.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains the Trades Management Interface, focusing on active position monitoring, trade creation and modification workflows, real-time updates, and user interaction patterns. It covers page lifecycle, data binding mechanisms, event handling for trade operations, and integration with the positions service layer. It also includes examples for creating new positions, modifying existing trades, closing positions, and managing position states, along with UI components used for display, form validation, error handling, and responsive design considerations.

## Project Structure
The trades management feature is implemented under features/positions and integrates with shared services and common UI components:
- Feature pages:
  - Active trades list and navigation
  - Trade detail view for editing and actions
  - Past trades view
- Service and repository layers:
  - Positions service orchestrating business logic
  - Repository abstraction over persistence
- Shared database utilities:
  - Base repository, DB service, local storage adapter
- Common UI components:
  - Trade modal, trade list, trade sheets (side panels)
- App shell and routing:
  - Application bootstrap and client-side router

```mermaid
graph TB
subgraph "Positions Feature"
TP["Trades Page<br/>features/positions/trades-page.js"]
TDP["Trade Detail Page<br/>features/positions/trade-detail-page.js"]
PP["Past Page<br/>features/positions/past-page.js"]
PS["Positions Service<br/>features/positions/positions-service.js"]
PR["Position Repository<br/>features/positions/PositionRepository.js"]
end
subgraph "Common UI"
TM["Trade Modal<br/>features/common/trade-modal.js"]
TL["Trade List<br/>features/common/trade-list.js"]
TS["Trade Sheets<br/>features/common/trade-sheets.js"]
end
subgraph "Shared DB"
BR["Base Repository<br/>shared/db/BaseRepository.js"]
DBS["DB Service<br/>shared/db/db-service.js"]
LDB["Local DB Adapter<br/>shared/db/local-db.js"]
end
subgraph "App Shell"
BOOT["Bootstrap<br/>shared/lib/bootstrap.js"]
ROUTER["Router<br/>features/common/router.js"]
SHELL["App Shell<br/>features/common/app-shell.js"]
end
TP --> PS
TDP --> PS
PP --> PS
PS --> PR
PR --> BR
BR --> DBS
DBS --> LDB
TP --> TL
TDP --> TM
TDP --> TS
BOOT --> ROUTER
ROUTER --> TP
ROUTER --> TDP
ROUTER --> PP
BOOT --> SHELL
```

**Diagram sources**
- [trades-page.js](file://features/positions/trades-page.js)
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [trade-modal.js](file://features/common/trade-modal.js)
- [trade-list.js](file://features/common/trade-list.js)
- [trade-sheets.js](file://features/common/trade-sheets.js)
- [BaseRepository.js](file://shared/db/BaseRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)
- [bootstrap.js](file://shared/lib/bootstrap.js)
- [router.js](file://features/common/router.js)
- [app-shell.js](file://features/common/app-shell.js)

**Section sources**
- [trades-page.js](file://features/positions/trades-page.js)
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [trade-modal.js](file://features/common/trade-modal.js)
- [trade-list.js](file://features/common/trade-list.js)
- [trade-sheets.js](file://features/common/trade-sheets.js)
- [BaseRepository.js](file://shared/db/BaseRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)
- [bootstrap.js](file://shared/lib/bootstrap.js)
- [router.js](file://features/common/router.js)
- [app-shell.js](file://features/common/app-shell.js)

## Core Components
- Trades Page: Renders the active trades list, triggers navigation to trade details, and coordinates real-time updates via the positions service.
- Trade Detail Page: Displays a single position’s details, provides forms for modifications, and exposes actions such as close or adjust size/price.
- Positions Service: Encapsulates business logic for fetching, creating, updating, and closing positions; manages subscriptions for live updates and normalizes data for UI consumption.
- Position Repository: Abstracts persistence operations, delegating to base repository and DB service.
- Common UI Components:
  - Trade List: Renders lists of positions with interactive rows and summary metrics.
  - Trade Modal: Presents inline forms for quick edits or confirmations.
  - Trade Sheets: Side panel overlays for detailed editing flows.
- Shared Database Layer:
  - Base Repository: Provides common CRUD helpers and subscription patterns.
  - DB Service: Centralized access to storage backends.
  - Local DB Adapter: In-memory or persistent local store implementation.
- App Shell and Router:
  - Bootstrap: Initializes app modules and routes.
  - Router: Handles navigation between trades, detail, and past views.
  - App Shell: Manages global layout and state.

**Section sources**
- [trades-page.js](file://features/positions/trades-page.js)
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [trade-list.js](file://features/common/trade-list.js)
- [trade-modal.js](file://features/common/trade-modal.js)
- [trade-sheets.js](file://features/common/trade-sheets.js)
- [BaseRepository.js](file://shared/db/BaseRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)
- [bootstrap.js](file://shared/lib/bootstrap.js)
- [router.js](file://features/common/router.js)
- [app-shell.js](file://features/common/app-shell.js)

## Architecture Overview
The interface follows a layered architecture:
- Presentation Layer: Pages and UI components render state and capture user interactions.
- Service Layer: Business logic and orchestration, including real-time subscriptions and normalization.
- Repository Layer: Data access abstraction over persistence.
- Storage Layer: Local database adapter and DB service.

```mermaid
sequenceDiagram
participant User as "User"
participant Router as "Router"
participant TradesPage as "Trades Page"
participant Service as "Positions Service"
participant Repo as "Position Repository"
participant DB as "DB Service"
participant Store as "Local DB Adapter"
User->>Router : Navigate to "Trades"
Router-->>TradesPage : Mount page component
TradesPage->>Service : subscribeToActivePositions()
Service->>Repo : fetchActivePositions()
Repo->>DB : query("active")
DB->>Store : read()
Store-->>DB : positions[]
DB-->>Repo : positions[]
Repo-->>Service : normalized[]
Service-->>TradesPage : stream(positions[])
TradesPage-->>User : Render active trades
User->>TradesPage : Click "Edit"
TradesPage->>Router : Navigate to "TradeDetail"
Router-->>TradeDetail : Mount detail page
TradeDetail->>Service : loadTrade(id)
Service->>Repo : fetchById(id)
Repo->>DB : get(id)
DB->>Store : read(id)
Store-->>DB : trade
DB-->>Repo : trade
Repo-->>Service : trade
Service-->>TradeDetail : trade
TradeDetail-->>User : Show edit form
```

**Diagram sources**
- [router.js](file://features/common/router.js)
- [trades-page.js](file://features/positions/trades-page.js)
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)

## Detailed Component Analysis

### Active Position Monitoring
- Real-time subscription: The trades page subscribes to active positions through the positions service, which maintains a live stream of changes.
- Normalization and diffing: The service normalizes incoming data and emits only changed items to minimize re-renders.
- UI update pattern: The page binds to the stream and updates the trade list incrementally.

```mermaid
flowchart TD
Start(["Mount Trades Page"]) --> Subscribe["Subscribe to Active Positions Stream"]
Subscribe --> Receive["Receive Batched Updates"]
Receive --> Normalize["Normalize & Diff"]
Normalize --> Bind["Bind to Trade List"]
Bind --> Render["Render Updated Rows"]
Render --> End(["Idle until next update"])
```

**Diagram sources**
- [trades-page.js](file://features/positions/trades-page.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [trade-list.js](file://features/common/trade-list.js)

**Section sources**
- [trades-page.js](file://features/positions/trades-page.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [trade-list.js](file://features/common/trade-list.js)

### Trade Creation Workflow
- Entry points:
  - From the trades page via a “New” action that opens the trade modal or sheet.
  - From the trade detail page when duplicating or adjusting parameters.
- Validation:
  - Client-side checks for required fields, numeric ranges, and constraints.
  - Server-side or service-level validation before persistence.
- Persistence:
  - Service calls repository create method.
  - Repository persists via DB service and local adapter.
- Post-create behavior:
  - Emit new position into active stream.
  - Update UI and navigate if needed.

```mermaid
sequenceDiagram
participant User as "User"
participant Modal as "Trade Modal"
participant Service as "Positions Service"
participant Repo as "Position Repository"
participant DB as "DB Service"
participant Store as "Local DB Adapter"
User->>Modal : Open "New Trade"
User->>Modal : Submit validated form
Modal->>Service : createTrade(payload)
Service->>Repo : save(payload)
Repo->>DB : insert(payload)
DB->>Store : write(payload)
Store-->>DB : ok
DB-->>Repo : id
Repo-->>Service : createdTrade
Service-->>Modal : success
Modal-->>User : Close and show confirmation
Service-->>TradesPage : emit new position
TradesPage-->>User : Update list
```

**Diagram sources**
- [trade-modal.js](file://features/common/trade-modal.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)
- [trades-page.js](file://features/positions/trades-page.js)

**Section sources**
- [trade-modal.js](file://features/common/trade-modal.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)
- [trades-page.js](file://features/positions/trades-page.js)

### Trade Modification Workflow
- Editing entry:
  - From trade list row click to open detail page.
  - From trade sheets for quick edits.
- Form binding:
  - Two-way binding between model and inputs.
  - Live validation feedback.
- Save flow:
  - Service validates and persists changes.
  - Emits updated position to subscribers.
- Undo/confirmation:
  - Optional confirmation dialogs for destructive changes.

```mermaid
sequenceDiagram
participant User as "User"
participant Detail as "Trade Detail Page"
participant Service as "Positions Service"
participant Repo as "Position Repository"
participant DB as "DB Service"
participant Store as "Local DB Adapter"
User->>Detail : Open trade for editing
Detail->>Service : loadTrade(id)
Service->>Repo : getById(id)
Repo->>DB : get(id)
DB->>Store : read(id)
Store-->>DB : trade
DB-->>Repo : trade
Repo-->>Service : trade
Service-->>Detail : trade
Detail-->>User : Render editable form
User->>Detail : Submit changes
Detail->>Service : updateTrade(id, patch)
Service->>Repo : update(id, patch)
Repo->>DB : update(id, patch)
DB->>Store : write(id, patch)
Store-->>DB : ok
DB-->>Repo : updatedTrade
Repo-->>Service : updatedTrade
Service-->>Detail : success
Service-->>TradesPage : emit updated position
TradesPage-->>User : Update list
```

**Diagram sources**
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)
- [trades-page.js](file://features/positions/trades-page.js)

**Section sources**
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)
- [trades-page.js](file://features/positions/trades-page.js)

### Closing Positions
- Initiation:
  - Action button on trade detail or list item.
- Confirmation:
  - Modal or sheet prompts for confirmation.
- Execution:
  - Service calls close operation on repository.
  - Repository persists closure and updates status.
- Post-close:
  - Remove from active stream and add to past stream.
  - Update UI accordingly.

```mermaid
flowchart TD
A["User clicks 'Close'"] --> B["Show confirmation dialog"]
B --> C{"Confirmed?"}
C --> |No| D["Cancel and return"]
C --> |Yes| E["Service.closeTrade(id)"]
E --> F["Repository.updateStatus(id, closed)"]
F --> G["DB Service writes change"]
G --> H["Emit removal from active"]
H --> I["Emit addition to past"]
I --> J["UI updates both lists"]
```

**Diagram sources**
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [trade-modal.js](file://features/common/trade-modal.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)
- [past-page.js](file://features/positions/past-page.js)
- [trades-page.js](file://features/positions/trades-page.js)

**Section sources**
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [trade-modal.js](file://features/common/trade-modal.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)
- [past-page.js](file://features/positions/past-page.js)
- [trades-page.js](file://features/positions/trades-page.js)

### Managing Position States
- State transitions:
  - Active -> Closed
  - Pending -> Active
  - Rejected -> Archived
- State propagation:
  - Service emits state change events.
  - Pages react by filtering streams and updating UI.
- History tracking:
  - Past page aggregates historical positions.

```mermaid
stateDiagram-v2
[*] --> Pending
Pending --> Active : "validated & opened"
Active --> Closed : "closed by user"
Active --> Rejected : "rejected by rules"
Rejected --> Archived : "archived"
Closed --> Archived : "moved to history"
Archived --> [*]
```

**Diagram sources**
- [positions-service.js](file://features/positions/positions-service.js)
- [past-page.js](file://features/positions/past-page.js)
- [trades-page.js](file://features/positions/trades-page.js)

**Section sources**
- [positions-service.js](file://features/positions/positions-service.js)
- [past-page.js](file://features/positions/past-page.js)
- [trades-page.js](file://features/positions/trades-page.js)

### UI Components for Trade Display and Interaction
- Trade List:
  - Renders rows with key metrics and actions.
  - Supports selection, sorting, and filtering.
- Trade Modal:
  - Inline forms for quick edits and confirmations.
  - Validates inputs and shows errors inline.
- Trade Sheets:
  - Full-screen or side-panel editing experience.
  - Integrates with navigation and back actions.

```mermaid
classDiagram
class TradeList {
+render(items)
+onRowClick(item)
+onAction(action, item)
}
class TradeModal {
+open(mode, data)
+submit(data)
+close()
}
class TradeSheets {
+show(component, data)
+hide()
}
TradeModal <.. TradeSheets : "used within"
TradeList --> TradeModal : "opens for edits"
TradeList --> TradeSheets : "opens for full edit"
```

**Diagram sources**
- [trade-list.js](file://features/common/trade-list.js)
- [trade-modal.js](file://features/common/trade-modal.js)
- [trade-sheets.js](file://features/common/trade-sheets.js)

**Section sources**
- [trade-list.js](file://features/common/trade-list.js)
- [trade-modal.js](file://features/common/trade-modal.js)
- [trade-sheets.js](file://features/common/trade-sheets.js)

### Page Lifecycle and Routing
- Bootstrap initializes the app shell and registers routes.
- Router mounts/unmounts pages based on URL or navigation actions.
- Each page subscribes to services on mount and unsubscribes on unmount to prevent leaks.

```mermaid
sequenceDiagram
participant Boot as "Bootstrap"
participant Shell as "App Shell"
participant Router as "Router"
participant Page as "Trades Page"
Boot->>Shell : Initialize app
Boot->>Router : Register routes
Router->>Page : Mount "Trades"
Page->>Page : OnMount : subscribe to service
Page-->>Router : OnUnmount : unsubscribe
```

**Diagram sources**
- [bootstrap.js](file://shared/lib/bootstrap.js)
- [app-shell.js](file://features/common/app-shell.js)
- [router.js](file://features/common/router.js)
- [trades-page.js](file://features/positions/trades-page.js)

**Section sources**
- [bootstrap.js](file://shared/lib/bootstrap.js)
- [app-shell.js](file://features/common/app-shell.js)
- [router.js](file://features/common/router.js)
- [trades-page.js](file://features/positions/trades-page.js)

### Data Binding Mechanisms
- Reactive streams:
  - Service emits arrays or objects representing positions.
  - Pages bind to these streams and update DOM efficiently.
- Form bindings:
  - Inputs bound to model fields with validation hooks.
  - Errors displayed near relevant fields.

```mermaid
flowchart TD
Svc["Service emits data"] --> Bind["Component binds to stream"]
Bind --> Model["Model updated"]
Model --> View["View re-renders affected parts"]
View --> Events["Event handlers dispatch actions"]
Events --> Svc
```

**Diagram sources**
- [positions-service.js](file://features/positions/positions-service.js)
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [trade-list.js](file://features/common/trade-list.js)

**Section sources**
- [positions-service.js](file://features/positions/positions-service.js)
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [trade-list.js](file://features/common/trade-list.js)

### Event Handling for Trade Operations
- Actions:
  - Create, update, close, duplicate.
- Handlers:
  - Validate input, call service methods, handle success/failure.
- Feedback:
  - Toasts or inline messages for user feedback.

```mermaid
sequenceDiagram
participant UI as "UI Component"
participant Handler as "Event Handler"
participant Service as "Positions Service"
participant Repo as "Position Repository"
participant DB as "DB Service"
participant Store as "Local DB Adapter"
UI->>Handler : onClick(action, payload)
Handler->>Handler : validate(payload)
alt valid
Handler->>Service : invoke(action, payload)
Service->>Repo : persist(action, payload)
Repo->>DB : write()
DB->>Store : commit()
Store-->>DB : ack
DB-->>Repo : result
Repo-->>Service : result
Service-->>UI : success
else invalid
Handler-->>UI : show validation errors
end
```

**Diagram sources**
- [trade-modal.js](file://features/common/trade-modal.js)
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)

**Section sources**
- [trade-modal.js](file://features/common/trade-modal.js)
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)

### Integration with Positions Service Layer
- Responsibilities:
  - Orchestrate repository calls.
  - Manage subscriptions and broadcasting.
  - Normalize and transform data for UI.
- Error handling:
  - Centralized error mapping and retry strategies.
- Caching:
  - Local cache for recent positions to reduce latency.

```mermaid
classDiagram
class PositionsService {
+subscribeToActivePositions()
+loadTrade(id)
+createTrade(payload)
+updateTrade(id, patch)
+closeTrade(id)
}
class PositionRepository {
+fetchActivePositions()
+getById(id)
+save(payload)
+update(id, patch)
+close(id)
}
class BaseRepository {
+query(collection, filters)
+get(id)
+set(id, data)
+update(id, patch)
}
class DBService {
+read(collection, id)
+write(collection, id, data)
+update(collection, id, patch)
}
class LocalDBAdapter {
+getItem(key)
+setItem(key, value)
+removeItem(key)
}
PositionsService --> PositionRepository : "uses"
PositionRepository --> BaseRepository : "extends"
BaseRepository --> DBService : "delegates"
DBService --> LocalDBAdapter : "persists"
```

**Diagram sources**
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [BaseRepository.js](file://shared/db/BaseRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)

**Section sources**
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [BaseRepository.js](file://shared/db/BaseRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)

### Examples of Common Workflows
- Creating a new position:
  - Open modal from trades page, fill form, submit, receive confirmation, see new item in list.
- Modifying an existing trade:
  - Navigate to detail page, edit fields, save, observe live update in list.
- Closing a position:
  - Click close action, confirm, remove from active list, appear in past list.
- Managing position states:
  - Observe state transitions and corresponding UI updates across pages.

[No sources needed since this section summarizes workflows without analyzing specific files]

### UI Components Used for Trade Display
- Trade List:
  - Row rendering, selection, and action buttons.
- Trade Modal:
  - Inline editing and confirmation dialogs.
- Trade Sheets:
  - Full-screen editing with navigation context.

**Section sources**
- [trade-list.js](file://features/common/trade-list.js)
- [trade-modal.js](file://features/common/trade-modal.js)
- [trade-sheets.js](file://features/common/trade-sheets.js)

### Form Validation
- Client-side validation:
  - Required fields, numeric constraints, range checks.
- Service-level validation:
  - Additional business rule enforcement before persistence.
- Error presentation:
  - Inline messages and focus management.

**Section sources**
- [trade-modal.js](file://features/common/trade-modal.js)
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [positions-service.js](file://features/positions/positions-service.js)

### Error Handling
- Centralized error mapping:
  - Service translates backend errors into user-friendly messages.
- Retry and fallback:
  - Network retries and cached data fallback.
- User feedback:
  - Toasts, banners, and inline errors.

**Section sources**
- [positions-service.js](file://features/positions/positions-service.js)
- [trade-modal.js](file://features/common/trade-modal.js)
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)

### Responsive Design Considerations
- Mobile-first layouts:
  - Trade list adapts to small screens with compact rows.
- Sheet vs modal:
  - Use sheets on larger screens, modals on smaller devices.
- Touch-friendly controls:
  - Larger tap targets and swipe gestures where applicable.

[No sources needed since this section provides general guidance]

## Dependency Analysis
The following diagram highlights direct dependencies among core components:

```mermaid
graph LR
TP["Trades Page"] --> PS["Positions Service"]
TDP["Trade Detail Page"] --> PS
PP["Past Page"] --> PS
PS --> PR["Position Repository"]
PR --> BR["Base Repository"]
BR --> DBS["DB Service"]
DBS --> LDB["Local DB Adapter"]
TP --> TL["Trade List"]
TDP --> TM["Trade Modal"]
TDP --> TS["Trade Sheets"]
BOOT["Bootstrap"] --> ROUTER["Router"]
ROUTER --> TP
ROUTER --> TDP
ROUTER --> PP
BOOT --> SHELL["App Shell"]
```

**Diagram sources**
- [trades-page.js](file://features/positions/trades-page.js)
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [past-page.js](file://features/positions/past-page.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [BaseRepository.js](file://shared/db/BaseRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)
- [trade-list.js](file://features/common/trade-list.js)
- [trade-modal.js](file://features/common/trade-modal.js)
- [trade-sheets.js](file://features/common/trade-sheets.js)
- [bootstrap.js](file://shared/lib/bootstrap.js)
- [router.js](file://features/common/router.js)
- [app-shell.js](file://features/common/app-shell.js)

**Section sources**
- [trades-page.js](file://features/positions/trades-page.js)
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [past-page.js](file://features/positions/past-page.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [PositionRepository.js](file://features/positions/PositionRepository.js)
- [BaseRepository.js](file://shared/db/BaseRepository.js)
- [db-service.js](file://shared/db/db-service.js)
- [local-db.js](file://shared/db/local-db.js)
- [trade-list.js](file://features/common/trade-list.js)
- [trade-modal.js](file://features/common/trade-modal.js)
- [trade-sheets.js](file://features/common/trade-sheets.js)
- [bootstrap.js](file://shared/lib/bootstrap.js)
- [router.js](file://features/common/router.js)
- [app-shell.js](file://features/common/app-shell.js)

## Performance Considerations
- Minimize re-renders:
  - Use incremental updates and keyed lists.
- Debounce rapid updates:
  - Coalesce frequent price or PnL changes.
- Pagination and virtualization:
  - For large trade histories, implement pagination or virtual scrolling.
- Efficient subscriptions:
  - Unsubscribe on unmount and scope listeners to active views.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Symptom: No positions displayed
  - Check subscription initialization and route mounting.
  - Verify DB service connectivity and local adapter availability.
- Symptom: Changes not reflected in UI
  - Ensure service emits updates after successful persistence.
  - Confirm UI binds to correct streams and keys are stable.
- Symptom: Validation errors not shown
  - Inspect form handler error mapping and field binding.
- Symptom: Navigation issues
  - Review router registration and page lifecycle hooks.

**Section sources**
- [trades-page.js](file://features/positions/trades-page.js)
- [trade-detail-page.js](file://features/positions/trade-detail-page.js)
- [positions-service.js](file://features/positions/positions-service.js)
- [router.js](file://features/common/router.js)
- [bootstrap.js](file://shared/lib/bootstrap.js)

## Conclusion
The Trades Management Interface implements a robust, layered architecture with clear separation of concerns. Active position monitoring leverages reactive streams for real-time updates, while trade creation and modification follow consistent workflows with strong validation and error handling. Integration with the positions service layer ensures reliable data persistence and state management. UI components provide flexible interaction patterns suitable for various screen sizes, and the overall design supports scalability and maintainability.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices
- Glossary:
  - Active positions: Currently open trades.
  - Past positions: Historical trades moved out of active view.
  - Trade sheets: Side-panel editing interfaces.
- Best practices:
  - Always unsubscribe from streams on unmount.
  - Normalize data at the service boundary.
  - Keep UI components stateless where possible.

[No sources needed since this section provides general guidance]