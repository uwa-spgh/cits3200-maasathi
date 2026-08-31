<template>
  <IonPage>
    <IonContent class="onboarding-content">
      <div class="onboarding-wrapper">
        <div v-if="step !== 'language'" class="top-row">
          <button class="back-btn" :aria-label="$t('common.back')" @click="goBack">
            <IonIcon :icon="arrowBackOutline" />
          </button>
        </div>

        <!-- Language -->
        <section v-if="step === 'language'" class="step-card">
          <h1 class="step-title">{{ $t('onboarding.welcome_title') }}</h1>
          <p class="step-text">{{ $t('onboarding.welcome_text') }}</p>
          <LanguageSwitcher class="language-picker" />
          <button class="answer-btn primary" @click="advance('name')">
            {{ $t('common.next') }}
          </button>
        </section>

        <!-- Name -->
        <section v-else-if="step === 'name'" class="step-card">
          <h1 class="step-title">{{ $t('onboarding.name_title') }}</h1>
          <IonItem lines="none" class="step-input">
            <IonInput
              v-model="name"
              :placeholder="$t('profile.name_placeholder')"
              :label="$t('profile.name_label')"
              label-placement="stacked"
            />
          </IonItem>
          <button class="answer-btn primary" @click="advance('lmp_known')">
            {{ $t('common.next') }}
          </button>
        </section>

        <!-- Q: LMP known? -->
        <section v-else-if="step === 'lmp_known'" class="step-card">
          <h1 class="step-title">{{ $t('onboarding.q_lmp') }}</h1>
          <button class="answer-btn" @click="advance('lmp_date')">{{ $t('common.yes') }}</button>
          <button class="answer-btn" @click="advance('edd_known')">{{ $t('common.no') }}</button>
        </section>

        <!-- A: LMP date -->
        <section v-else-if="step === 'lmp_date'" class="step-card">
          <h1 class="step-title">{{ $t('onboarding.q_lmp_when') }}</h1>
          <IonItem lines="none" class="step-input">
            <IonInput v-model="lmp" type="date" @ionInput="onLmpInput" />
          </IonItem>
          <button class="answer-btn primary" :disabled="!lmp" @click="advance('tt_ever')">
            {{ $t('common.next') }}
          </button>
        </section>

        <!-- Q: EDD known -->
        <section v-else-if="step === 'edd_known'" class="step-card">
          <h1 class="step-title">{{ $t('onboarding.q_edd') }}</h1>
          <button class="answer-btn" @click="advance('edd_date')">{{ $t('common.yes') }}</button>
          <button class="answer-btn" @click="advance('estimate')">{{ $t('common.no') }}</button>
        </section>

        <!-- A: EDD date -->
        <section v-else-if="step === 'edd_date'" class="step-card">
          <h1 class="step-title">{{ $t('onboarding.q_edd_when') }}</h1>
          <IonItem lines="none" class="step-input">
            <IonInput v-model="edd" type="date" @ionInput="onEddInput" />
          </IonItem>
          <button class="answer-btn primary" :disabled="!edd" @click="advance('tt_ever')">
            {{ $t('common.next') }}
          </button>
        </section>

        <!-- Q: estimate months pregnant -->
        <section v-else-if="step === 'estimate'" class="step-card">
          <h1 class="step-title">{{ $t('onboarding.q_estimate') }}</h1>
          <div class="count-chips">
            <button
              v-for="n in 9"
              :key="n"
              class="count-chip"
              :class="{ selected: estimateMonths === n }"
              @click="estimateMonths = n"
            >
              {{ n }}
            </button>
          </div>
          <p class="step-hint">{{ $t('onboarding.estimate_hint') }}</p>
          <button
            class="answer-btn primary"
            :disabled="estimateMonths === null"
            @click="confirmEstimate"
          >
            {{ $t('common.next') }}
          </button>
        </section>

        <!-- Q: TT ever -->
        <section v-else-if="step === 'tt_ever'" class="step-card">
          <h1 class="step-title">{{ $t('profile.tt_question') }}</h1>
          <button class="answer-btn" @click="advance('tt_count_known')">{{ $t('common.yes') }}</button>
          <button class="answer-btn" @click="setTtAndFinish('never')">{{ $t('common.no') }}</button>
          <button class="answer-btn subtle" @click="setTtAndFinish('unknown')">
            {{ $t('common.not_sure') }}
          </button>
        </section>

        <!-- Q: TT count known -->
        <section v-else-if="step === 'tt_count_known'" class="step-card">
          <h1 class="step-title">{{ $t('onboarding.q_tt_count') }}</h1>
          <button class="answer-btn" @click="advance('tt_details')">{{ $t('common.yes') }}</button>
          <button class="answer-btn" @click="setTtAndFinish('unknown')">{{ $t('common.no') }}</button>
        </section>

        <!-- A: TT details -->
        <section v-else-if="step === 'tt_details'" class="step-card">
          <h1 class="step-title">{{ $t('profile.tt_dose_count_label') }}</h1>
          <div class="count-chips">
            <button
              v-for="n in 5"
              :key="n"
              class="count-chip"
              :class="{ selected: ttDoses === n }"
              @click="ttDoses = n"
            >
              {{ n }}
            </button>
          </div>
          <IonItem lines="none" class="step-input">
            <IonInput
              v-model="ttLastDate"
              type="date"
              :label="$t('profile.tt_last_dose_label')"
              label-placement="stacked"
            />
          </IonItem>
          <button
            class="answer-btn primary"
            :disabled="ttDoses === null"
            @click="setTtAndFinish('known')"
          >
            {{ $t('common.next') }}
          </button>
        </section>

        <!-- Done -->
        <section v-else class="step-card">
          <h1 class="step-title">{{ $t('onboarding.done_title') }}</h1>
          <p class="step-text">{{ $t('onboarding.done_text') }}</p>
          <IonIcon :icon="heartCircleOutline" class="done-icon" />
          <button class="answer-btn primary" @click="finish">
            {{ $t('onboarding.start_app') }}
          </button>
        </section>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useIonRouter } from '@ionic/vue';
import { IonContent, IonIcon, IonInput, IonItem } from '@ionic/vue';
import { arrowBackOutline, heartCircleOutline } from 'ionicons/icons';

import LanguageSwitcher from '../components/LanguageSwitcher.vue';
import { useUser } from '../composables/useUser';
import { usePregnancy } from '../composables/usePregnancy';
import { useTt } from '../composables/useTt';
import { completeOnboarding } from '../bootstrap';
import { addDaysIso, eddFromLmp, lmpFromEdd, todayIso } from '../utils/date';
import { requestNotificationPermission } from '../services/notifications';
import { registerBackHandler } from '../utils/backHandler';
import type { TtStatus } from '../db/schemas';

type Step =
  | 'language'
  | 'name'
  | 'lmp_known'
  | 'lmp_date'
  | 'edd_known'
  | 'edd_date'
  | 'estimate'
  | 'tt_ever'
  | 'tt_count_known'
  | 'tt_details'
  | 'done';

const router = useIonRouter();
const { setUserName } = useUser();
const { registerPregnancy } = usePregnancy();
const { setRegistration } = useTt();

const step = ref<Step>('language');
const flowStack = ref<Step[]>([]);
const name = ref('');
const lmp = ref('');
const edd = ref('');
const estimateMonths = ref<number | null>(null);
const ttStatus = ref<TtStatus>('not_asked');
const ttDoses = ref<number | null>(null);
const ttLastDate = ref('');

function advance(next: Step): void {
  flowStack.value.push(step.value);
  step.value = next;
}

function goBack(): void {
  const prev = flowStack.value.pop();
  if (prev) step.value = prev;
}

let unregisterBack: (() => void) | null = null;

onMounted(() => {
  unregisterBack = registerBackHandler(() => {
    if (flowStack.value.length === 0) return false;
    goBack();
    return true;
  });
});

onUnmounted(() => {
  unregisterBack?.();
  unregisterBack = null;
});

function onLmpInput(): void {
  if (lmp.value) edd.value = eddFromLmp(lmp.value);
}

function onEddInput(): void {
  if (edd.value) lmp.value = lmpFromEdd(edd.value);
}

/**
 * The user does not know either exact date, so she estimates how many
 * months pregnant she is. The LMP is approximated from today; the EDD
 * follows. Both can be corrected later in the Profile.
 */
function confirmEstimate(): void {
  if (estimateMonths.value === null) return;
  const daysGone = estimateMonths.value * 30;
  lmp.value = addDaysIso(todayIso(), -daysGone);
  edd.value = eddFromLmp(lmp.value);
  advance('tt_ever');
}

function setTtAndFinish(status: TtStatus): void {
  ttStatus.value = status;
  advance('done');
}

async function finish(): Promise<void> {
  setUserName(name.value);
  if (lmp.value || edd.value) {
    await registerPregnancy({
      lmp: lmp.value || null,
      edd: edd.value || null
    });
  }
  if (ttStatus.value !== 'not_asked') {
    await setRegistration({
      status: ttStatus.value,
      dosesReceived: ttStatus.value === 'known' ? ttDoses.value : null,
      lastDoseDate: ttStatus.value === 'known' ? ttLastDate.value || null : null,
      cardAvailable: ttStatus.value === 'known'
    });
  }
  await completeOnboarding();
  void requestNotificationPermission();
  router.replace({ name: 'Home' });
}
</script>

<style scoped>
.onboarding-content {
  --background: var(--color-app-bg, #fbf7f5);
}

.onboarding-wrapper {
  max-width: 420px;
  margin: 0 auto;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  padding: 24px 16px;
}

.top-row {
  display: flex;
}

.back-btn {
  height: 42px;
  width: 42px;
  border-radius: 50%;
  border: none;
  background: var(--color-card-bg, #eaeaea);
  color: var(--color-card-text, #1a1a1a);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.back-btn ion-icon {
  font-size: 1.3rem;
}

.step-card {
  background-color: var(--color-card-bg, #eaeaea);
  border-radius: 24px;
  padding: 28px 22px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.step-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-card-text, #1a1a1a);
}

.step-text {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  opacity: 0.85;
  color: var(--color-card-text, #1a1a1a);
}

.step-input {
  --background: var(--color-app-bg, #fbf7f5);
  border-radius: 14px;
  padding: 4px 8px;
}

.language-picker {
  align-self: center;
}

.answer-btn {
  border: 2px solid var(--color-profile-bg, #33a1de);
  background: var(--color-app-bg, #fbf7f5);
  color: var(--color-card-text, #1a1a1a);
  border-radius: 999px;
  padding: 14px 20px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.answer-btn:active {
  transform: scale(0.97);
}

.answer-btn:disabled {
  opacity: 0.45;
}

.answer-btn.primary {
  background: var(--color-profile-bg, #33a1de);
  color: var(--color-profile-text, #000);
}

.answer-btn.subtle {
  border-color: transparent;
  background: transparent;
  opacity: 0.75;
  font-size: 0.9rem;
}

.done-icon {
  font-size: 4rem;
  color: var(--color-btn-more-bg, #7bc62d);
  align-self: center;
}

.count-chips {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.count-chip {
  height: 48px;
  width: 48px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.2);
  background: var(--color-app-bg, #fbf7f5);
  color: var(--color-card-text, #1a1a1a);
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
}

.count-chip.selected {
  border-color: var(--color-profile-bg, #33a1de);
  background: var(--color-profile-bg, #33a1de);
  color: var(--color-profile-text, #000);
}

.step-hint {
  margin: 0;
  font-size: 0.8rem;
  font-style: italic;
  opacity: 0.7;
  color: var(--color-card-text, #1a1a1a);
}
</style>
