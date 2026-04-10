# ChainPulse Pitch Deck

## 1. The Elevator Pitch & Problem Statement
> ChainPulse is a supply chain intelligence platform that turns live shipment data into action. It helps teams track cargo, detect disruptions, score risk, and surface rerouting recommendations before a delay becomes a failure.

In plain English, we built a control room for shipments. A logistics operator can see where cargo is, what is threatening it, how risky it is right now, and what to do next. The problem this solves is not just visibility, but decision speed: supply chain disruptions are expensive precisely because teams often learn about them too late, or they see them in disconnected tools that do not translate into action.

What matters here is that the product is not a static dashboard. It combines real-time shipment state, a risk model, simulated disruptions, and a live front-end experience so a judge can see the system reacting end-to-end. The app is designed to feel like an operational system, not a demo shell.

## 2. The Core Architecture (The "Aha!" Moment)
> The core idea is simple: every shipment is a live entity with location, risk, ETA, and ownership, and the platform continuously updates that entity through both model-driven assessment and disruption-driven events.

The user flow starts in the React frontend. The user logs in through Supabase auth in [chainpulse-frontend/src/auth/AuthProvider.jsx](chainpulse-frontend/src/auth/AuthProvider.jsx), which exposes the current session and user to the rest of the app. From there, the main dashboard in [chainpulse-frontend/src/App.jsx](chainpulse-frontend/src/App.jsx) fetches the user’s shipments, connects to the Socket.IO stream, and keeps the map, cards, alerts, and simulator synchronized.

The shipment list is refreshed periodically by [chainpulse-frontend/src/hooks/useShipments.js](chainpulse-frontend/src/hooks/useShipments.js), which gives the UI a simple but reliable polling layer on top of live socket updates. That matters because the app is doing two things at once: it is reacting to push events, and it is also reconciling state with the backend every 30 seconds so the dashboard does not drift.

When a judge clicks Assess Risk, the frontend calls the prediction API through [chainpulse-frontend/src/services/api.js](chainpulse-frontend/src/services/api.js), which reaches the backend endpoint in [chainpulse-backend/app/routes/predictions.py](chainpulse-backend/app/routes/predictions.py). That backend route combines three signals: a deterministic model score, live shipment state, and active disruption exposure. The result is a blended risk score that is easier to explain than a raw model probability and more useful than a model score alone.

When a disruption is triggered from the simulator, the backend in [chainpulse-backend/app/main.py](chainpulse-backend/app/main.py) evaluates every in-transit shipment against the disruption’s coordinates and radius, updates the affected records, emits websocket events, and returns a payload the frontend can display immediately. In other words, the same shipment object powers the map marker, the card, the risk modal, the alert feed, and the disruption panel. That shared state model is the "aha" moment of the system.

## 3. Backend & Side Logic Deep-Dive
> The backend is doing the real work: schema management, ownership filtering, ETA calculation, disruption simulation, risk scoring, and event emission.

The data layer lives in [chainpulse-backend/app/database.py](chainpulse-backend/app/database.py). The Shipment model stores the operational fields that matter for this product: owner email, tracking ID, origin and destination coordinates, current position, cargo type, status, risk score, route distance, departure date, ETA, and creation time. That model is intentionally simple, because the application’s complexity is not in the schema itself; it is in how the schema is used.

Ownership is enforced through `owner_email` in the shipment routes. The list endpoint in [chainpulse-backend/app/routes/shipments.py](chainpulse-backend/app/routes/shipments.py) scopes shipments to the current owner, and demo data is only auto-seeded for the demo account. That prevents the classic multi-tenant bug where a new user accidentally sees someone else’s shipments. The code also avoids reseeding real users after delete, which was a practical bug we fixed during the build.

Shipment creation is guarded by validation in [chainpulse-backend/app/routes/shipments.py](chainpulse-backend/app/routes/shipments.py). The backend checks that origin and destination are present, not identical, coordinates are valid, route distance is positive, and the departure date is not unrealistically far in the future. It also auto-generates the tracking ID and calculates ETA server-side so the client cannot corrupt those values.

Risk assessment is handled in [chainpulse-backend/app/routes/predictions.py](chainpulse-backend/app/routes/predictions.py). The route generates stable DataCo-style features from shipment fields, loads the XGBoost artifacts through [chainpulse-backend/app/ml/predictor.py](chainpulse-backend/app/ml/predictor.py), calibrates the raw model probability, contextualizes it with live disruption exposure and route progress, and then blends the model signal with the live shipment score. That is why the displayed risk is explainable: the response includes model score, raw score, live score, risk level, factors, recommendation, and reroute guidance.

The ML pipeline in [chainpulse-backend/app/ml/train.py](chainpulse-backend/app/ml/train.py) is deliberately leakage-safe. We removed the leakage-prone feature that would have made the model look artificially good, then retrained XGBoost on a smaller, more defensible feature set. The training script also prints classification reports, confusion matrices, and tuned threshold metrics, which makes the evaluation audit-friendly.

The live disruption engine is in [chainpulse-backend/app/main.py](chainpulse-backend/app/main.py). It uses the Haversine formula to calculate distance between a disruption and a shipment, applies a severity-based risk boost, adjusts ETA, records a snapshot for rollback, and emits websocket events for shipment updates, risk assessments, alerts, and new disruption banners. That is the side logic that makes the product feel live instead of mocked.

There is also a small but important operational detail: the backend startup path performs schema bootstrapping and column migration checks before seeding data. That gives the app a better chance of starting cleanly across local dev and demo environments without needing a separate migration stack.

## 4. The "Wow" Factor
> The most impressive piece is the end-to-end disruption simulation pipeline: one action triggers a database update, a risk recalculation, ETA changes, websocket emissions, and a front-end popup that explains the impact in human language.

The best technical hook in this repository is the disruption flow that starts in the simulator and ends with a live, explainable risk modal. In [chainpulse-frontend/src/components/Simulator/DisruptionSimulator.jsx](chainpulse-frontend/src/components/Simulator/DisruptionSimulator.jsx), demo mode now targets an actual shipment route instead of a random ocean point, which guarantees that a live shipment is affected when the demo runs against real data. That was a practical hack, but it is also a strong product decision: judges see meaningful impact every time.

On the backend side, [chainpulse-backend/app/main.py](chainpulse-backend/app/main.py) updates the shipment state, stores ETA before and after disruption, and emits both the disruption payload and the affected shipment list. The frontend then opens the same risk assessment modal from either the Assess Risk button or the disruption list, so the explanation layer is consistent no matter how the user arrives there.

The other standout piece is the risk scoring model in [chainpulse-backend/app/routes/predictions.py](chainpulse-backend/app/routes/predictions.py). Instead of dumping a raw model probability on the screen, the app blends a calibrated model score with live operational signal and disruption exposure. That gives the judges a stronger story: the product is not pretending the model is perfect; it is using the model as one input inside a decision layer that is better aligned with operations.

## 5. Exhaustive Judge Q&A Defense
> Below are the questions most likely to come up in a technical judging panel, with direct answers grounded in the code.

### Scalability & Performance

- **What happens if you get 10,000 users tomorrow?**
  The current system is built as a clean demo-scale architecture, but the seams are already service-oriented. The backend is FastAPI with async SQLAlchemy, the frontend polls shipment state every 30 seconds in [chainpulse-frontend/src/hooks/useShipments.js](chainpulse-frontend/src/hooks/useShipments.js), and the live event layer uses Socket.IO in [chainpulse-frontend/src/services/socket.js](chainpulse-frontend/src/services/socket.js). To scale up, we would move the polling-heavy pieces toward event-driven updates, shard by tenant, and add caching for read-heavy endpoints like list shipments and dashboard stats.

- **Where are your bottlenecks right now?**
  The biggest bottleneck is the database round trip pattern, especially when the app fetches shipments and then performs per-shipment updates during disruption simulation. The code is already async, but the next step would be batching updates and adding indexed query paths for owner email, tracking ID, and active status.

- **Why do you poll every 30 seconds if you already use sockets?**
  Polling is a defensive reconciliation layer. Websockets provide immediacy, but polling ensures the UI catches up after refreshes, reconnects, or missed events. That choice trades a small amount of extra read traffic for operational stability.

- **How expensive is the disruption simulation?**
  It is bounded by the number of in-transit shipments. The backend in [chainpulse-backend/app/main.py](chainpulse-backend/app/main.py) filters to in-transit shipments, computes distance per shipment, and only mutates the ones inside the affected radius. That is a linear pass over the active working set, which is fine for the current product size and easy to optimize later.

- **How would you optimize read performance?**
  Add database indexes for owner_email and status, cache dashboard aggregates, and precompute route-related metadata. For the frontend, keep the optimistic UI updates, but reduce redundant reloads by reconciling socket payloads directly into local state.

- **How would you handle more real-time traffic?**
  We would push the live updates into a message broker, fan out websocket updates by tenant, and separate the analytics/risk scoring path from the transactional shipment CRUD path. The current code is already separated cleanly enough to support that split.

### Security

- **How are you securing user data and API access?**
  The app uses Supabase auth on the frontend in [chainpulse-frontend/src/auth/AuthProvider.jsx](chainpulse-frontend/src/auth/AuthProvider.jsx), and the backend scopes shipment access by owner_email in the route layer. That means data access is not based on the UI alone; the backend applies the ownership filter before returning records.

- **Could one user see another user’s shipments?**
  Not through the intended API path. The list and assessment routes filter by owner_email, and demo data seeding is isolated to the demo owner. That was a core multi-tenant fix we made during the build.

- **Where do API keys live?**
  The repository structure expects environment-based configuration through backend settings and frontend Supabase client configuration. The code avoids hardcoding secrets in the source tree.

- **Are your websocket events authenticated?**
  In the current implementation, the socket layer is optimized for demo and internal control-room behavior. For a production version, we would bind socket connections to authenticated tenant sessions and enforce tenant-scoped event channels.

- **How do you prevent bad shipment inputs?**
  Shipment creation validates origin, destination, coordinates, route distance, and departure date in [chainpulse-backend/app/routes/shipments.py](chainpulse-backend/app/routes/shipments.py). The backend also generates the tracking ID and ETA itself, so the client cannot spoof those fields.

- **Could a malicious client force an invalid status?**
  The new shipment flow no longer exposes a manual status picker, and the backend defaults new shipments to in_transit. Status changes are handled through the application’s update and disruption logic, not through arbitrary client input.

### Tech Stack Choices

- **Why FastAPI?**
  FastAPI fits this app because the backend is heavily API-centric, async-friendly, and schema-driven. It pairs well with Pydantic models for typed request and response contracts, which is useful for the shipment, disruption, and prediction flows.

- **Why PostgreSQL and async SQLAlchemy?**
  The data is relational and tenant-scoped, so PostgreSQL is the right default. Async SQLAlchemy lets the backend handle API and socket work without blocking, which matters for live shipment updates and simulation events.

- **Why XGBoost?**
  We kept XGBoost because it performs well on tabular classification, it is easy to explain in a hackathon setting, and it is strong for mixed numeric features like the ones extracted from the shipment data. The training script in [chainpulse-backend/app/ml/train.py](chainpulse-backend/app/ml/train.py) also shows the evaluation path clearly.

- **Why did you blend model score with live score instead of trusting the model alone?**
  Because the best operational answer is not always the pure model probability. The backend in [chainpulse-backend/app/routes/predictions.py](chainpulse-backend/app/routes/predictions.py) deliberately combines live shipment state with calibrated model signal so the app remains useful even when the model is uncertain or overconfident.

- **Why use Socket.IO instead of only REST?**
  REST handles durable fetches and state changes, while Socket.IO gives the app immediacy for shipment movements, disruption banners, risk updates, and alerts. The mix is intentional: REST for source-of-truth actions, sockets for live UX.

- **Why do you still have a demo seed dataset?**
  Because a hackathon demo needs deterministic behavior on first run. The seed path in [chainpulse-backend/app/routes/shipments.py](chainpulse-backend/app/routes/shipments.py) gives the judges a ready-made dashboard without requiring manual data loading.

### Challenges

- **What was the hardest technical bug you faced?**
  One of the hardest issues was the mismatch between what the model expected and what the predictor was supplying. We solved that by aligning the feature order in [chainpulse-backend/app/ml/predictor.py](chainpulse-backend/app/ml/predictor.py), reloading artifacts safely, and keeping the runtime feature generation deterministic.

- **What other bug was especially painful?**
  The delete flow looked successful in the UI but the data reappeared on refresh because the backend delete path was not actually awaited and the demo reseed logic recreated shipments for real users. We fixed both sides: proper async delete behavior and seed isolation for the demo account.

- **Did you have any data leakage issues in the model?**
  Yes, and we addressed them directly by removing a leakage-prone field from training. The retrained pipeline in [chainpulse-backend/app/ml/train.py](chainpulse-backend/app/ml/train.py) is intentionally more honest, even if that means the raw metrics are lower than the inflated version.

- **Why did the original model scores feel too stable?**
  Because static model outputs are often a sign that the runtime feature space is too narrow or too disconnected from the live shipment context. The assessment route now contextualizes the score with route progress and active disruption exposure so the displayed risk changes in a way that matches the operational situation.

- **What made the demo simulator difficult?**
  The simulator had to look dramatic, but it also had to produce deterministic, visible impact. The final version in [chainpulse-frontend/src/components/Simulator/DisruptionSimulator.jsx](chainpulse-frontend/src/components/Simulator/DisruptionSimulator.jsx) targets a live shipment route so the demo does not depend on luck.

- **What was the hardest product decision?**
  Probably deciding not to expose shipment status as a manual user input for new shipments. That simplified the form and made the model and backend own the lifecycle state, which is a cleaner product story for this app.

### Future Roadmap

- **What would you build with another 24 hours?**
  I would add richer route geometry, more realistic rerouting, and a true historical timeline of shipment state transitions. I would also replace the periodic refresh pattern with tenant-scoped live subscriptions end to end.

- **What is the next ML improvement?**
  Train a better calibrated model on a larger set of real shipment outcomes, add threshold tuning per cargo type, and persist per-route risk histories so the system can learn seasonality and lane-specific behavior.

- **What would make the simulator stronger?**
  I would simulate disruption propagation across neighboring lanes, add severity escalation over time, and connect the disruption timeline to the ETA delta so the judge can see the system evolve minute by minute.

- **How would you improve trust in the risk score?**
  Add a transparent explanation layer that shows why the score changed: proximity to disruption, cargo type, route progress, and historical delay patterns. The current response already exposes the beginning of that story through factors and recommendations.

- **Would you keep the current stack?**
  Yes for the current scope. FastAPI, PostgreSQL, React, Socket.IO, and XGBoost are a strong fit for a product that needs live state, explainable scoring, and a fast hackathon demo cycle. I would only split pieces out once usage or team size justified it.

- **What would you change if this became a production product?**
  I would add proper tenant isolation at the data layer, more robust auth on sockets, formal migrations, job orchestration for background simulation, and observability around model decisions and disruption events.
