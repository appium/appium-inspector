/** Move one action within its pointer and keep the position-based tick IDs consistent. */
export function moveGestureTick(pointers, pointerId, tickId, tickIndexOffset) {
  const pointer = pointers.find(({id}) => id === pointerId);
  const tickIndex = pointer?.ticks.findIndex(({id}) => id === tickId) ?? -1;
  const targetTickIndex = tickIndex + tickIndexOffset;
  if (
    tickIndex < 0 ||
    !Number.isInteger(tickIndexOffset) ||
    tickIndexOffset === 0 ||
    targetTickIndex < 0 ||
    targetTickIndex >= pointer.ticks.length
  ) {
    return pointers;
  }

  const newTicks = [...pointer.ticks];
  const [movedTick] = newTicks.splice(tickIndex, 1);
  newTicks.splice(targetTickIndex, 0, movedTick);

  return pointers.map((currentPointer) =>
    currentPointer.id === pointerId
      ? {
          ...currentPointer,
          ticks: newTicks.map((currentTick, position) => ({
            ...currentTick,
            id: `${pointerId}.${position + 1}`,
          })),
        }
      : currentPointer,
  );
}
