export const printSheet = () => {
  if (typeof window.desktopPrint === "function") {
    window.desktopPrint();
    return;
  }
  window.print();
};
