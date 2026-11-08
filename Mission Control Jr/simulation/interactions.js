/** Bind a physical station button to its stable station ID, ignoring the DOM click event. */
export function stationActionHandler(station, interact) {
  return () => interact(station.id);
}
