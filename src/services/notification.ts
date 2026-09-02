/* section 2 Maternal Tetanus Toxoid (TT) Vaccination */
/* follows fsm design to handle conditions for recording and reminding */
/* registeration needs to be developed to integrate into the program */

/* states */
const state ={
    known: "Known", //when user knowns tt/td history
    unknown: "Unknown", //user unsure or has not done tt/td
    nextDose: "NextDose", //based on user detail it determines next dose
    record:"Record", //store user info
    reminder: "Reminder", //send notif for next dos    
    doseDone: "DoseDone", //5 doses have been done
};

/* transition. current info -> next step
userData -> both states are relevant to user's history */
const transition = {
    [state.known]:{
        userMessage: state.record,
    },
    [state.unknown]:{
        userData: state.nextDose,
    },
    [state.nextDose]:{
        userAlert: state.reminder,
    },
    [state.reminder]:{
        userData: state.record,
    },
    [state.record]:{
        //consider if doses are done or need more
        doseIncomplete: state.nextDose,
        doseComplete: state.doseDone,
    },
    [state.doseDone]:{
        //no transition
    },
};

