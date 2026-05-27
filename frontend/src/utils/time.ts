import dayjs from "dayjs";

export const toUnixRange = (
  dateISO: string,
  endOfDay: boolean,
): number | undefined => {
  if (!dateISO) {
    return undefined;
  }

  const date = dayjs(dateISO);
  if (!date.isValid()) {
    return undefined;
  }

  return (endOfDay ? date.endOf("day") : date.startOf("day")).unix();
};

export const formatRelativeTimeEs = (timestampEpox: number): string => {
  const now = dayjs();
  const messageDate = dayjs.unix(timestampEpox);
  const minutes = Math.max(now.diff(messageDate, "minute"), 0);

  if (minutes <= 60) {
    return `hace ${minutes} min`;
  }

  const hours = Math.max(now.diff(messageDate, "hour"), 1);
  return `hace ${hours} h`;
};
