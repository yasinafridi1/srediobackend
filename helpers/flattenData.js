import mongoose from "mongoose";

const flateStage2 = (obj, prefix = "") => {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    const prefixedKey = prefix ? `${prefix}_${key}` : key;

    if (value instanceof mongoose.Types.ObjectId) {
      acc[prefixedKey] = value.toString();
    } else if (Array.isArray(value)) {
      // Handle array of primitives or objects
      if (value.every((v) => typeof v !== "object" || v === null)) {
        acc[prefixedKey] = value.join(", ");
      } else {
        value.forEach((el, idx) => {
          const nested = flateStage2(el, `${prefixedKey}[${idx}]`);
          Object.assign(acc, nested);
        });
      }
    } else if (typeof value === "object" && value !== null) {
      Object.assign(acc, flateStage2(value, prefixedKey));
    } else {
      acc[prefixedKey] = value;
    }

    return acc;
  }, {});
};

const flateStage1 = (data) => {
  return {
    _id: data._id,
    userId: data?.userId,
    ...(data?.baseId && { baseId: data?.baseId }),
    ...(data?.name && { name: data?.name }),
    ...(data?.permissionLevel && { permissionLevel: data?.permissionLevel }),
    ...(data?.permissionLevel && { permissionLevel: data?.permissionLevel }),
    ...(data?.tableId && { tableId: data?.tableId }),
    ...data?.rawData,
  };
};

/**
 * Convert nested object/array to plan object
 * @param {Object} item - item to be flatten
 * @returns {Object} - Plain Object
 */

const flattenData = (item) => {
  const stg1 = flateStage1(item);
  const stg2 = flateStage2(stg1);

  return stg2;
};

export default flattenData;
