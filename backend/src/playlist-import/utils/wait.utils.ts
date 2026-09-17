/** How long until something is allowed again, for a message a player reads. */
export const inWords = (seconds: number): string => {
  if (seconds < 60) {
    return 'in under a minute';
  }
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `in ${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  const hours = Math.round(minutes / 60);
  return `in ${hours} hour${hours === 1 ? '' : 's'}`;
};
