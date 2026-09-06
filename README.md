# Food Calculator v1.4

Changes in this version:
- Sections 2 and 3 are amalgamated into one compact "Meal photo & details" card.
- "Take a Photo" is the primary/default route.
- "Choose Existing" remains as the backup photo-library route.
- After taking or selecting a photo, the image opens in a confirmation popup.
- The user can Retake or Use This Photo.
- A confirmed photo collapses to a small thumbnail so it does not consume the screen.
- The main workflow is compacted to avoid scrolling on typical modern iPhone-sized screens.
- Shorter devices fall back to scrolling rather than clipping content.
- Existing BG safety checks, settings, calculation arithmetic and local history are retained.

Primary workflow:
BG → Take photo → confirm photo → meal details → calculate → confirm & save


## v1.4 adjustment
- The data-entry screen remains intentionally fixed/no-scroll where it fits.
- Once Calculate is pressed successfully, vertical scrolling is enabled.
- The result area is brought into view so the Confirm & save button can always be reached.
- Clearing the meal returns the app to the compact no-scroll input layout.
