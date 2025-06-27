export const structureBases = (data, userId) => {
  const structureData = data.map((item) => {
    const { id, name, permissionLevel } = item;
    return {
      userId,
      baseId: id,
      name,
      permissionLevel,
    };
  });
  return structureData;
};

export const structureTables = (data, baseId, userId) => {
  const structureData = data.map((item) => {
    return {
      userId,
      baseId,
      rawData: item,
    };
  });
  return structureData;
};

export const structureTickets = (data, baseId, tableId, userId) => {
  const structureData = data.map((item) => {
    return {
      userId,
      baseId,
      tableId,
      rawData: item,
    };
  });

  return structureData;
};
