/**
 * Central icon registry for the Home (Proposal 2) experience.
 *
 * DEVELOPER NOTE: to swap any icon, change it here only — every Home
 * component imports its icons from this file, so no component code or
 * template needs to change. All values must be valid `ionicons/icons`
 * exports (each resolves to an SVG path string for `<IonIcon>`).
 */
import {
  chevronBackCircle,
  chevronForwardCircle,
  happyOutline,
  heartOutline,
  home,
  homeOutline,
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

import calender from '../assets/icons/calendar_month_96dp_000000_FILL0_wght400_GRAD0_opsz48.svg';
import childFace from '../assets/icons/child_care_96dp_000000_FILL0_wght400_GRAD0_opsz48.svg';
import clockWthreeDots from '../assets/icons/chronic_96dp_000000_FILL0_wght400_GRAD0_opsz48.svg';
import pen from '../assets/icons/ink_pen_96dp_000000_FILL0_wght400_GRAD0_opsz48.svg';
import menstrualHealth from '../assets/icons/menstrual_health_96dp_000000_FILL0_wght400_GRAD0_opsz48.svg';
import syringe from '../assets/icons/syringe_96dp_000000_FILL0_wght400_GRAD0_opsz48.svg';
import vaccineDoses from '../assets/icons/vaccines_96dp_000000_FILL0_wght400_GRAD0_opsz48.svg';
import wavingHand from '../assets/icons/waving_hand_96dp_000000_FILL0_wght400_GRAD0_opsz48.svg';

export const homeIcons = {
  /** Timeline rail scroll controls */
  railBack: chevronBackCircle,
  railForward: chevronForwardCircle,
  /** Timeline node states */
  nodeAction: shieldCheckmarkOutline,
  /** Timeline node per event type — shown inside every circle */
  nodeAnc: pulseOutline,
  nodePnc: homeOutline,
  nodeTt: shieldCheckmarkOutline,
  nodeMilestone: heartOutline,
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

export const onBoardingIcons = {
  /* icons for the onboarding page */
  calender: calender,
  childFace: childFace,
  clockWthreeDots: clockWthreeDots,
  pen: pen,
  menstrualHealth: menstrualHealth,
  syringe: syringe,
  vaccineDoses: vaccineDoses,
  wavingHand: wavingHand
} as const;

export type HomeIconKey = keyof typeof homeIcons;
