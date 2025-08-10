export const findOne = async (model, filter) => {
  return await model.findOne(filter);
};

export const create = async (model, data) => {
  return await model.create(data);
};
export const updateOne = async (model, filter, update) => {
  return await model.updateOne(filter, update);
};
export const findById = async (model, id, projection = {}) => {
  return model.findById(id, projection);
};
