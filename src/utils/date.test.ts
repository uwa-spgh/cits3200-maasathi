import{expect, test, describe,it} from "vitest";
import { addDaysIso, addMonthsIso,daysBetween,eddFromLmp,formatDate,gestationalWeek,lmpFromEdd,nextDueFromLastDose,postpartumDays,toIsoDate } from "./date";
//constraint check for calender

//Edge case - 30
test("30 day month, move onto next month",()=>{
    expect(addDaysIso("2026-04-30",1)).toBe("2026-05-01");
});
test("30 day month, move onto next month",()=>{
     expect(addDaysIso("2026-04-30",1)).toBe("2026-05-01");
});
test("30 day month, move onto next month",()=>{
    expect(addDaysIso("2026-06-30",1)).toBe("2026-07-01");
});
//Edge case - 31
test("31 day month, move onto next month",()=>{
    expect(addDaysIso("2025-12-31",1)).toBe("2026-01-01");
});
test("31 day month, move onto next month",()=>{
    expect(addDaysIso("2026-03-31",1)).toBe("2026-04-01");
});
test("31 day month, move onto next month",()=>{
    expect(addDaysIso("2027-05-31",1)).toBe("2027-06-01");
});
//Edge case - Leap year
test("Leap year",()=>{
    expect(addDaysIso("2028-02-29",1)).toBe("2028-03-01");
});
test("Leap year",()=>{
    expect(addDaysIso("2024-02-29",1)).toBe("2024-03-01");
});
test("Leap year",()=>{
    expect(addDaysIso("2020-02-29",1)).toBe("2020-03-01");
});
//Edge case - Non Leap year
test("Non leap year",()=>{
    expect(addDaysIso("2026-02-28",1)).toBe("2026-03-01");
});
test("Non leap year",()=>{
    expect(addDaysIso("2026-02-28",1)).toBe("2026-03-01");
});
test("Non leap year",()=>{
    expect(addDaysIso("2023-02-28",1)).toBe("2023-03-01");
});

//Month leap and non leap cases
test("Adding month to  leap",()=>{
    expect(addMonthsIso("2024-01-31",1)).toBe("2024-02-29");
});
test("Adding month to leap",()=>{
    expect(addMonthsIso("2020-01-31",1)).toBe("2020-02-29");
});
test("Adding month to leap",()=>{
    expect(addMonthsIso("2020-02-29",1)).toBe("2020-03-29");
});
test("Adding month to non leap",()=>{
    expect(addMonthsIso("2026-01-31",1)).toBe("2026-02-28");
});
test("Adding month to non leap",()=>{
    expect(addMonthsIso("2025-02-28",1)).toBe("2025-03-28");
});
//Negative valu
test("Negative value",()=>{
    expect(addDaysIso("2026-09-05",-1)).toBe("2026-09-04");
});

//code indexes Jan as 0 instead as 1-12
//ensure the YYYY/MM/DD is formatted correctly
test("Correct format of date", ()=>{
    const date = new Date(2026,0,24);
    expect(toIsoDate(date)).toBe('2026-01-24');
});
test("Correct format of date",()=>{
    const date = new Date(2026,2,3);
    expect(toIsoDate(date)).toBe('2026-03-03');
});
test("Correct format of date",()=>{
    const date = new Date(2026,4,19);
    expect(toIsoDate(date)).toBe('2026-05-19');
});

//gestional week
//how many week pregnant
describe('gestionalWeek',()=>{
    it('Last menstural cycle day is week 1',()=>{
        expect(gestationalWeek('2026-09-01','2026-09-1')).toBe(1);
    });
    it('Last menstural cycle',()=>{
        expect(gestationalWeek('2026-09-01','2026-09-08')).toBe(2);
    });
});
//Estimated delivery date, eddFromLmp
describe('EDD from LMC, LMC from EDD',()=>{
    it('EDD = LMP + 280 days',()=>{
        expect(eddFromLmp('2026-01-01')).toBe('2026-10-08');
    });
    it('LMP = EDD-280, inverse calculation',()=>{
        expect(lmpFromEdd('2026-10-08')).toBe('2026-01-01');
    });
});

//known delivery date
//postpartum
//days since delivery
//Date before delivery = 0
describe('days since delivery',()=>{
    it('How many days since delivery',()=>{
        expect(postpartumDays('2026-10-05','2026-10-20')).toBe(15);
    });
    it('How many days since delivery, date before delivery',()=>{
        expect(postpartumDays('2026-10-05','2026-10-01')).toBe(0);
    });
    it('How many days since delivery, on the day of delivery',()=>{
        expect(postpartumDays('2026-10-05','2026-10-05')).toBe(0);
    });
});

//Visit doses
describe('TT dose',()=>{
    it('TT1 due in 28 days',()=>{
        expect(nextDueFromLastDose(1,'2027-03-01')).toBe('2027-03-29');
        expect(nextDueFromLastDose(0,'2026-10-05')).toBe('2026-11-02');
    });
    it('TT2 due in 6 months',()=>{
        expect(nextDueFromLastDose(2,'2027-03-10')).toBe('2027-09-10');
    });
    it('TT3/TT4 due in 12 months',()=>{
        expect(nextDueFromLastDose(3,'2026-09-01')).toBe('2027-09-01');
        expect(nextDueFromLastDose(4,'2025-03-05')).toBe('2026-03-05');
    });
});
//language format
describe('Formate date in the respective language',()=>{
    it('Format for En file',()=>{
        expect(formatDate('2026-09-05')).toBe('5 Sept 2026');
    });
});