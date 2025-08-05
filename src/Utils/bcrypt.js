import bcrypt from "bcrypt";

export const hashPassword = (password) => {
  return bcrypt.hashSync(password, Number(process.env.SALT));
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
