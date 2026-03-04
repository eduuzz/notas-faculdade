export const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.03 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.15 },
};

export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
  transition: { duration: 0.2 },
};

export const collapseVariants = {
  open: { height: 'auto', opacity: 1 },
  closed: { height: 0, opacity: 0, overflow: 'hidden' },
};
