/**
 * Central icon registry for the Home (Proposal 2) experience.
 *
 * DEVELOPER NOTE: to swap any icon, change it here only — every Home
 * component imports its icons from this file, so no component code or
 * template needs to change. All values must be valid `ionicons/icons`
 * exports (each resolves to an SVG path string for `<IonIcon>`).
 */
import {
  checkmarkCircle,
  chevronBackCircle,
  chevronForwardCircle,
  ellipseOutline,
  happyOutline,
  home,
  informationCircleOutline,
  nutritionOutline,
  personOutline,
  pulseOutline,
  shieldCheckmarkOutline,
  timeOutline,
  volumeHighOutline,
  walkOutline,
  warningOutline,
  waterOutline
} from 'ionicons/icons';

export const homeIcons = {
  /** Timeline rail scroll controls */
  railBack: chevronBackCircle,
  railForward: chevronForwardCircle,
  /** Timeline node states */
  nodeDone: checkmarkCircle,
  nodeTodo: ellipseOutline,
  nodeAction: shieldCheckmarkOutline,
  /** Reminder card: title icon + large graphic */
  reminderTitle: timeOutline,
  reminderGraphic: pulseOutline,
  /** "How are you?" card title icon */
  wellbeingTitle: happyOutline,
  /** Nutrition card: title icon + large graphic (runner + food) */
  nutritionTitle: waterOutline,
  nutritionGraphicMain: walkOutline,
  nutritionGraphicSecondary: nutritionOutline,
  /** Buttons */
  listen: volumeHighOutline,
  learnMore: informationCircleOutline,
  /** Bottom navigation */
  navProfile: personOutline,
  navHome: home,
  navDanger: warningOutline
} as const;

export type HomeIconKey = keyof typeof homeIcons;
