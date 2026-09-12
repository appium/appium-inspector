/** Move one action within its pointer and keep the position-based tick IDs consistent. */
export function moveGestureTick(pointers, pointerId, tickId, offset) {
  const pointer = pointers.find(({id}) => id === pointerId);
  const index = pointer?.ticks.findIndex(({id}) => id === tickId) ?? -1;
  const targetIndex = index + offset;
  if (
    index < 0 ||
    !Number.isInteger(offset) ||
    offset === 0 ||
    targetIndex < 0 ||
    targetIndex >= pointer.ticks.length
  ) {
    return pointers;
  }

  const ticks = [...pointer.ticks];
  const [tick] = ticks.splice(index, 1);
  ticks.splice(targetIndex, 0, tick);

  return pointers.map((currentPointer) =>
    currentPointer.id === pointerId
      ? {
          ...currentPointer,
          ticks: ticks.map((currentTick, position) => ({
            ...currentTick,
            id: `${pointerId}.${position + 1}`,
          })),
        }
      : currentPointer,
  );
}
