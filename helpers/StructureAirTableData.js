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

export const structureTables = (data, baseDocId, userId, baseId) => {
  const structureData = data.map((item) => {
    return {
      userId,
      baseDocId,
      baseId,
      rawData: item,
    };
  });
  return structureData;
};

export const structureTickets = (
  data,
  baseDocId,
  baseId,
  tableDocId,
  tableId,
  userId
) => {
  const structureData = data.map((item) => {
    return {
      userId,
      baseDocId,
      tableDocId,
      baseId,
      tableId,
      recordId: item?.id,
      rawData: item,
    };
  });

  return structureData;
};
