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
  shieldCheckmarkOutline,
} from 'ionicons/icons';

import calender from '../assets/icons/calendar_month_96dp_000000_FILL0_wght400_GRAD0_opsz48.svg';
import childFace from '../assets/icons/child_care_96dp_000000_FILL0_wght400_GRAD0_opsz48.svg';
import clockWthreeDots from '../assets/icons/chronic_96dp_000000_FILL0_wght400_GRAD0_opsz48.svg';
import pen from '../assets/icons/ink_pen_96dp_000000_FILL0_wght400_GRAD0_opsz48.svg';
import menstrualHealth from '../assets/icons/menstrual_health_96dp_000000_FILL0_wght400_GRAD0_opsz48.svg';
import syringe from '../assets/icons/syringe_96dp_000000_FILL0_wght400_GRAD0_opsz48.svg';
import vaccineDoses from '../assets/icons/vaccines_96dp_000000_FILL0_wght400_GRAD0_opsz48.svg';
import wavingHand from '../assets/icons/waving_hand_96dp_000000_FILL0_wght400_GRAD0_opsz48.svg';

import heartOutline from '../assets/icons/favorite_64dp_000000_FILL0_wght700_GRAD0_opsz48.svg';
import healthCheck from '../assets/icons/stethoscope_64dp_000000_FILL0_wght400_GRAD0_opsz48.svg';
import water from '../assets/icons/water_drop_64dp_000000_FILL0_wght700_GRAD0_opsz48.svg';
import walk from '../assets/icons/directions_walk_64dp_000000_FILL0_wght700_GRAD0_opsz48.svg';
import nutrition from '../assets/icons/nutrition_64dp_000000_FILL0_wght700_GRAD0_opsz48.svg';
import clock from '../assets/icons/schedule_64dp_000000_FILL0_wght700_GRAD0_opsz48.svg';
import smile from '../assets/icons/sentiment_satisfied_64dp_000000_FILL0_wght700_GRAD0_opsz48.svg';
import home from '../assets/icons/home_64dp_000000_FILL1_wght700_GRAD0_opsz48.svg';
import info from '../assets/icons/info_64dp_000000_FILL0_wght700_GRAD0_opsz48.svg';
import profile from '../assets/icons/person_64dp_000000_FILL0_wght700_GRAD0_opsz48.svg';
import listen from '../assets/icons/volume_up_64dp_000000_FILL1_wght700_GRAD0_opsz48.svg';
import warning from '../assets/icons/warning_64dp_000000_FILL0_wght700_GRAD0_opsz48.svg';


export const homeIcons = {
  /** Timeline rail scroll controls */
  railBack: chevronBackCircle,
  railForward: chevronForwardCircle,

  /** Timeline node states */
  nodeAction: shieldCheckmarkOutline,

  /** Timeline node per event type — shown inside every circle */
  nodeAnc: healthCheck,
  nodePnc: healthCheck,
  nodeTt: syringe,
  nodeMilestone: heartOutline,

  /** Reminder card: title icon + large graphic */
  reminderTitle: clock,
  reminderGraphic: healthCheck,

  /** "How are you?" card title icon */
  wellbeingTitle: smile,

  /** Nutrition card: title icon + large graphic (runner + food) */
  nutritionTitle: water,
  nutritionGraphicMain: walk,
  nutritionGraphicSecondary: nutrition,

  /** Buttons */
  listen: listen,
  learnMore: info,

  /** Bottom navigation */
  navProfile: profile,
  navHome: home,
  navDanger: warning
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
