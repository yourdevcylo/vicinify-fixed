# Vicinify — Map Navigation & Establishment Upload Fix (2026-10-31)

## Navigation
- AI Get directions now switches from List to the **actual Map view** before routing.
- AI View on map uses the same centralized map-focus logic before moving/marking the place.
- Every `routeToPlace` caller (list cards, map popups, establishment details) uses the same map-focus route.
- `showPage` accepts an explicit `discoveryView` override for map-directed actions; ordinary navigation still remembers the user-selected view.
- Removed the second Map/List click handler which changed CSS without updating saved view state or accessibility attributes.
- Invalid/missing location, denied GPS and missing routing library now provide feedback rather than silently leaving the List view visible.
- Map size is invalidated after the responsive page becomes visible.

## Establishment cover / logo
- Add/Edit Establishment save displays a loading spinner and accessible status/error message.
- Owner cover/logo processing decodes/re-encodes JPG, PNG or WebP locally and keeps small WebP data in Firestore, avoiding Firebase Storage for this specific form.
- Validation and a 25-second save deadline make failures visible.
- Cover/logo image size/quality is intentionally limited; more detailed images may be rejected with an actionable error.

## Deployment and caveats
- Deploy the complete site, including Netlify Functions. Hard refresh and test on both desktop and mobile.
- Existing Firebase/Firestore security rules still apply; a `permission-denied` from those rules cannot be fixed by frontend changes alone.
- No live Firestore production test performed; test navigation and photo saves on the deployed site before defense.
