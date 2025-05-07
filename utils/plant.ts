import { addDays, addMonths, addWeeks } from "date-fns";

  // 计算下次提醒时间
  export const calculateNextRemindTime = (unit: string, interval: number) => {
    const now = new Date();

    switch (unit) {
      case 'day':
        return addDays(now, interval).getTime();
      case 'week':
        return addWeeks(now, interval).getTime();
      case 'month':
        return addMonths(now, interval).getTime();
      default:
        return now.getTime();
    }
  };