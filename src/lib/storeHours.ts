// Utility functions for business hours

export interface StoreHours {
  monday_open: string | null;
  monday_close: string | null;
  tuesday_open: string | null;
  tuesday_close: string | null;
  wednesday_open: string | null;
  wednesday_close: string | null;
  thursday_open: string | null;
  thursday_close: string | null;
  friday_open: string | null;
  friday_close: string | null;
  saturday_open: string | null;
  saturday_close: string | null;
  sunday_open: string | null;
  sunday_close: string | null;
  timezone: string;
  is_24_7: boolean;
  temporary_closure: boolean;
  closure_message: string | null;
}

export const DAYS_OF_WEEK = [
  'sunday',
  'monday', 
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
] as const;

export const DAY_NAMES = {
  monday: 'Monday',
  tuesday: 'Tuesday', 
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
} as const;

export function isStoreCurrentlyOpen(storeHours: StoreHours): {
  isOpen: boolean;
  status: string;
  nextChange?: string;
} {
  if (storeHours.temporary_closure) {
    return {
      isOpen: false,
      status: storeHours.closure_message || 'Temporarily Closed'
    };
  }

  if (storeHours.is_24_7) {
    return {
      isOpen: true,
      status: 'Open 24/7'
    };
  }

  const now = new Date();
  const dayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentDay = DAYS_OF_WEEK[dayIndex];
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  const openKey = `${currentDay}_open` as keyof StoreHours;
  const closeKey = `${currentDay}_close` as keyof StoreHours;
  
  const openTime = storeHours[openKey] as string | null;
  const closeTime = storeHours[closeKey] as string | null;

  if (!openTime || !closeTime) {
    return {
      isOpen: false,
      status: 'Closed Today'
    };
  }

  // Check if current time is between open and close
  const isCurrentlyOpen = currentTime >= openTime && currentTime <= closeTime;

  if (isCurrentlyOpen) {
    return {
      isOpen: true,
      status: `Open until ${formatTime(closeTime)}`,
      nextChange: `Closes at ${formatTime(closeTime)}`
    };
  } else {
    // Find next opening time
    let nextOpenDay = currentDay;
    let nextOpenTime = openTime;
    
    // If it's past closing time today, check tomorrow
    if (currentTime > closeTime) {
      const tomorrowIndex = (dayIndex + 1) % 7;
      nextOpenDay = DAYS_OF_WEEK[tomorrowIndex];
      const tomorrowOpenKey = `${nextOpenDay}_open` as keyof StoreHours;
      nextOpenTime = storeHours[tomorrowOpenKey] as string | null;
    }

    if (nextOpenTime) {
      const dayName = nextOpenDay === currentDay ? 'today' : DAY_NAMES[nextOpenDay as keyof typeof DAY_NAMES];
      return {
        isOpen: false,
        status: `Closed - Opens ${dayName} at ${formatTime(nextOpenTime)}`,
        nextChange: `Opens ${dayName} at ${formatTime(nextOpenTime)}`
      };
    }

    return {
      isOpen: false,
      status: 'Closed'
    };
  }
}

export function formatTime(time: string): string {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  return `${displayHour}:${minutes} ${ampm}`;
}

export function formatStoreHours(storeHours: StoreHours): string[] {
  if (storeHours.is_24_7) {
    return ['Open 24/7'];
  }

  const formattedHours: string[] = [];
  
  DAYS_OF_WEEK.slice(1).forEach(day => { // Skip Sunday, add it at the end
    const openKey = `${day}_open` as keyof StoreHours;
    const closeKey = `${day}_close` as keyof StoreHours;
    
    const openTime = storeHours[openKey] as string | null;
    const closeTime = storeHours[closeKey] as string | null;
    
    const dayName = DAY_NAMES[day as keyof typeof DAY_NAMES];
    
    if (openTime && closeTime) {
      formattedHours.push(`${dayName}: ${formatTime(openTime)} - ${formatTime(closeTime)}`);
    } else {
      formattedHours.push(`${dayName}: Closed`);
    }
  });

  // Add Sunday at the end
  const sundayOpen = storeHours.sunday_open;
  const sundayClose = storeHours.sunday_close;
  
  if (sundayOpen && sundayClose) {
    formattedHours.push(`Sunday: ${formatTime(sundayOpen)} - ${formatTime(sundayClose)}`);
  } else {
    formattedHours.push('Sunday: Closed');
  }

  return formattedHours;
}

export function getStoreStatusBadgeColor(isOpen: boolean, isClosed: boolean = false): string {
  if (isClosed) return 'bg-red-100 text-red-800 border-red-200';
  if (isOpen) return 'bg-green-100 text-green-800 border-green-200';
  return 'bg-yellow-100 text-yellow-800 border-yellow-200';
}