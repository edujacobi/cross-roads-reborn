export declare function useDateFormat(): {
    shortDateTime: (date: string | Date) => string;
    shortDateShortTime: (date: string | Date) => string;
    longDate: (date: string | Date) => string;
    shortDate: (date: string | Date) => string;
    shortMonthDay: (date: string | Date) => string;
    shortTime: (date: string | Date) => string;
    dateTime: (date: string | Date) => string;
    longDateTime: (date: string | Date) => string;
    toGameDateTimeInput: (date: string | Date) => string;
    fromGameDateTimeInput: (value: string) => Date;
    calendarDay: (date: string | Date) => number;
    hourInGameTime: (date: string | Date) => number;
    relative: (date: string | Date, addSuffix?: boolean) => string;
    distance: (date1: string | Date, date2: string | Date) => string;
    decimalHoursToDeclarative: (decimalHours: number) => string;
};
